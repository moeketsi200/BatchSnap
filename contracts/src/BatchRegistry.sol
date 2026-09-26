// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BatchRegistry
 * @notice Gas-minimized provenance and single-claim anti-counterfeit registry for small producers.
 * @dev Anchors IPFS metadata CIDs on Layer 2 and supports both batch-level and unit-serialized
 *      cryptographic QR secret verification.
 */
contract BatchRegistry {
    // =============================================================
    //                           TYPES
    // =============================================================

    struct Batch {
        uint256 batchId;
        address producer;
        string ipfsCID;        // Points to JSON containing dates, images, and lab tests
        bytes32 secretHash;    // Keccak256 hash of single-use validation secret
        uint256 createdAt;
        bool isClaimed;
    }

    struct VerificationResult {
        bool isAuthentic;      // True if hash(secret) matches batch or registered unit secret
        bool alreadyClaimed;   // True if this secret was already verified/claimed previously
        uint256 claimedAt;     // Timestamp when the secret was first claimed (0 if unclaimed)
        uint256 totalUnits;    // Number of serialized units in the batch (1 for single-secret batch)
        uint256 claimedUnits;  // Number of serialized units claimed so far
        Batch batch;           // Core batch metadata struct
    }

    // =============================================================
    //                           ERRORS
    // =============================================================

    error BatchNotFound(uint256 batchId);
    error InvalidCID();
    error InvalidSecretHash();
    error InvalidSecret();
    error AlreadyClaimed(uint256 batchId, uint256 claimedAt);

    // =============================================================
    //                           EVENTS
    // =============================================================

    event BatchCreated(
        uint256 indexed batchId,
        address indexed producer,
        string ipfsCID,
        bytes32 secretHash,
        uint256 unitCount,
        uint256 createdAt
    );

    event BatchClaimed(
        uint256 indexed batchId,
        bytes32 indexed secretHash,
        address indexed claimedBy,
        uint256 claimedAt
    );

    event TamperReported(
        uint256 indexed batchId,
        address indexed reporter,
        string locationInfo,
        uint256 reportedAt
    );

    // =============================================================
    //                           STORAGE
    // =============================================================

    uint256 private _nextBatchId = 1001;

    /// @notice Maps batchId => Batch struct
    mapping(uint256 => Batch) private _batches;

    /// @notice Maps batchId => timestamp when the primary batch secret was claimed
    mapping(uint256 => uint256) public batchClaimedAt;

    /// @notice Maps batchId => unit secretHash => whether that serialized unit exists in this batch
    mapping(uint256 => mapping(bytes32 => bool)) public isUnitInBatch;

    /// @notice Maps batchId => unit secretHash => timestamp when that unit was claimed (0 if unclaimed)
    mapping(uint256 => mapping(bytes32 => uint256)) public unitClaimedAt;

    /// @notice Maps batchId => total number of serialized units registered
    mapping(uint256 => uint256) public batchTotalUnits;

    /// @notice Maps batchId => number of serialized units claimed so far
    mapping(uint256 => uint256) public batchClaimedUnits;

    /// @notice Maps producer address => list of created batchIds
    mapping(address => uint256[]) private _producerBatches;

    // =============================================================
    //                      PRODUCER FUNCTIONS
    // =============================================================

    /**
     * @notice Creates a new batch anchored to an IPFS CID with a single validation secret hash.
     * @param ipfsCID The IPFS CID pointing to the batch metadata JSON (photos, harvest date, CoA).
     * @param secretHash Keccak256 hash of the plaintext secret (`keccak256(abi.encodePacked(secret))`).
     * @return batchId The newly minted batch ID.
     */
    function createBatch(
        string calldata ipfsCID,
        bytes32 secretHash
    ) external returns (uint256 batchId) {
        if (bytes(ipfsCID).length == 0) revert InvalidCID();
        if (secretHash == bytes32(0)) revert InvalidSecretHash();

        batchId = _nextBatchId++;

        _batches[batchId] = Batch({
            batchId: batchId,
            producer: msg.sender,
            ipfsCID: ipfsCID,
            secretHash: secretHash,
            createdAt: block.timestamp,
            isClaimed: false
        });

        batchTotalUnits[batchId] = 1;
        _producerBatches[msg.sender].push(batchId);

        emit BatchCreated(batchId, msg.sender, ipfsCID, secretHash, 1, block.timestamp);
    }

    /**
     * @notice Creates a batch with multiple serialized unit secret hashes (e.g., for an Avery label sheet).
     * @param ipfsCID The IPFS CID pointing to the batch metadata JSON.
     * @param primarySecretHash Primary batch secret hash (or hash of the first unit / batch master key).
     * @param unitSecretHashes Array of keccak256 hashes for each individual printed QR label in the batch.
     * @return batchId The newly minted batch ID.
     */
    function createSerializedBatch(
        string calldata ipfsCID,
        bytes32 primarySecretHash,
        bytes32[] calldata unitSecretHashes
    ) external returns (uint256 batchId) {
        if (bytes(ipfsCID).length == 0) revert InvalidCID();
        if (primarySecretHash == bytes32(0)) revert InvalidSecretHash();

        batchId = _nextBatchId++;

        _batches[batchId] = Batch({
            batchId: batchId,
            producer: msg.sender,
            ipfsCID: ipfsCID,
            secretHash: primarySecretHash,
            createdAt: block.timestamp,
            isClaimed: false
        });

        uint256 unitCount = unitSecretHashes.length;
        for (uint256 i = 0; i < unitCount; ++i) {
            bytes32 unitHash = unitSecretHashes[i];
            if (unitHash == bytes32(0)) revert InvalidSecretHash();
            isUnitInBatch[batchId][unitHash] = true;
        }

        batchTotalUnits[batchId] = unitCount > 0 ? unitCount : 1;
        _producerBatches[msg.sender].push(batchId);

        emit BatchCreated(
            batchId,
            msg.sender,
            ipfsCID,
            primarySecretHash,
            batchTotalUnits[batchId],
            block.timestamp
        );
    }

    // =============================================================
    //               CONSUMER VERIFICATION & CLAIMING
    // =============================================================

    /**
     * @notice Claims a batch or a serialized unit within a batch using the plaintext QR secret.
     * @dev Reverts with `AlreadyClaimed` if the QR code was previously claimed (anti-counterfeit trigger).
     * @param batchId The ID of the batch being scanned.
     * @param secret The plaintext secret string from the scanned QR code (`?secret=...`).
     */
    function claimBatch(uint256 batchId, string calldata secret) external {
        Batch storage batch = _batches[batchId];
        if (batch.createdAt == 0) revert BatchNotFound(batchId);

        bytes32 providedHash = keccak256(abi.encodePacked(secret));

        // Check if this matches a serialized unit in the batch
        if (isUnitInBatch[batchId][providedHash]) {
            uint256 prevClaim = unitClaimedAt[batchId][providedHash];
            if (prevClaim != 0) {
                revert AlreadyClaimed(batchId, prevClaim);
            }

            unitClaimedAt[batchId][providedHash] = block.timestamp;
            batchClaimedUnits[batchId] += 1;

            // If all units in the batch are now claimed (or if primary matches), update top-level flag
            if (batchClaimedUnits[batchId] >= batchTotalUnits[batchId] || providedHash == batch.secretHash) {
                batch.isClaimed = true;
                if (batchClaimedAt[batchId] == 0) {
                    batchClaimedAt[batchId] = block.timestamp;
                }
            }

            emit BatchClaimed(batchId, providedHash, msg.sender, block.timestamp);
            return;
        }

        // Otherwise check the primary batch secretHash
        if (providedHash != batch.secretHash) {
            revert InvalidSecret();
        }

        if (batch.isClaimed) {
            revert AlreadyClaimed(batchId, batchClaimedAt[batchId]);
        }

        batch.isClaimed = true;
        batchClaimedAt[batchId] = block.timestamp;
        batchClaimedUnits[batchId] = 1;

        emit BatchClaimed(batchId, providedHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Read-only (`eth_call`) verification check for the consumer web portal.
     * @param batchId The batch ID from the QR URL (`/v/[id]`).
     * @param secret The plaintext secret query parameter (`?secret=...`).
     * @return result Detailed verification status without costing gas.
     */
    function verifyBatch(
        uint256 batchId,
        string calldata secret
    ) external view returns (VerificationResult memory result) {
        Batch memory batch = _batches[batchId];
        if (batch.createdAt == 0) revert BatchNotFound(batchId);

        bytes32 providedHash = keccak256(abi.encodePacked(secret));
        bool isSerializedUnit = isUnitInBatch[batchId][providedHash];
        bool isPrimaryMatch = (providedHash == batch.secretHash);

        result.batch = batch;
        result.totalUnits = batchTotalUnits[batchId];
        result.claimedUnits = batchClaimedUnits[batchId];

        if (isSerializedUnit) {
            uint256 unitClaimTime = unitClaimedAt[batchId][providedHash];
            result.isAuthentic = true;
            result.alreadyClaimed = (unitClaimTime != 0);
            result.claimedAt = unitClaimTime;
        } else if (isPrimaryMatch) {
            result.isAuthentic = true;
            result.alreadyClaimed = batch.isClaimed;
            result.claimedAt = batchClaimedAt[batchId];
        } else {
            result.isAuthentic = false;
            result.alreadyClaimed = false;
            result.claimedAt = 0;
        }
    }

    /**
     * @notice Allows a consumer to report a suspected duplicate/counterfeit scan location.
     * @param batchId The batch ID printed on the label.
     * @param locationInfo Optional retail store / city note provided by the buyer.
     */
    function reportTamper(uint256 batchId, string calldata locationInfo) external {
        if (_batches[batchId].createdAt == 0) revert BatchNotFound(batchId);
        emit TamperReported(batchId, msg.sender, locationInfo, block.timestamp);
    }

    // =============================================================
    //                         VIEW HELPERS
    // =============================================================

    /**
     * @notice Returns the raw Batch struct for a given batchId.
     */
    function getBatch(uint256 batchId) external view returns (Batch memory) {
        if (_batches[batchId].createdAt == 0) revert BatchNotFound(batchId);
        return _batches[batchId];
    }

    /**
     * @notice Returns all batch IDs created by a specific producer address.
     */
    function getProducerBatches(address producer) external view returns (uint256[] memory) {
        return _producerBatches[producer];
    }

    /**
     * @notice Helper to compute the secretHash off-chain or via eth_call.
     */
    function hashSecret(string calldata secret) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(secret));
    }
}

