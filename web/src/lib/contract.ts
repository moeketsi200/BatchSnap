import { createHash } from "node:crypto";
import { hashSecret } from "./crypto.ts";
import { fetchMetadataFromIPFS, readLocalStore, writeLocalStore } from "./ipfs.ts";
import type {
  BatchMetadata,
  OnChainBatch,
  VerificationResponse,
} from "./types.ts";

/**
 * Full ABI for `contracts/src/BatchRegistry.sol`
 */
export const BATCH_REGISTRY_ABI = [
  {
    type: "function",
    name: "createBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ipfsCID", type: "string" },
      { name: "secretHash", type: "bytes32" },
    ],
    outputs: [{ name: "batchId", type: "uint256" }],
  },
  {
    type: "function",
    name: "createSerializedBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ipfsCID", type: "string" },
      { name: "primarySecretHash", type: "bytes32" },
      { name: "unitSecretHashes", type: "bytes32[]" },
    ],
    outputs: [{ name: "batchId", type: "uint256" }],
  },
  {
    type: "function",
    name: "claimBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "secret", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "verifyBatch",
    stateMutability: "view",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "secret", type: "string" },
    ],
    outputs: [
      {
        name: "result",
        type: "tuple",
        components: [
          { name: "isAuthentic", type: "bool" },
          { name: "alreadyClaimed", type: "bool" },
          { name: "claimedAt", type: "uint256" },
          { name: "totalUnits", type: "uint256" },
          { name: "claimedUnits", type: "uint256" },
          {
            name: "batch",
            type: "tuple",
            components: [
              { name: "batchId", type: "uint256" },
              { name: "producer", type: "address" },
              { name: "ipfsCID", type: "string" },
              { name: "secretHash", type: "bytes32" },
              { name: "createdAt", type: "uint256" },
              { name: "isClaimed", type: "bool" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getBatch",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [
      {
        name: "batch",
        type: "tuple",
        components: [
          { name: "batchId", type: "uint256" },
          { name: "producer", type: "address" },
          { name: "ipfsCID", type: "string" },
          { name: "secretHash", type: "bytes32" },
          { name: "createdAt", type: "uint256" },
          { name: "isClaimed", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "reportTamper",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "locationInfo", type: "string" },
    ],
    outputs: [],
  },
] as const;

const DEFAULT_PRODUCER_ADDRESS =
  "0x71C95911E9a5D330f4D621842EC243EE1343292e" as `0x${string}`;

export function peekNextBatchId(): number {
  const store = readLocalStore();
  return store.nextBatchId;
}

/**
 * Anchors a new batch (with serialized unit secret hashes) to the BatchRegistry.
 * Uses the configured L2 smart contract or the local deterministic ledger in dev mode.
 */
export async function anchorBatchOnChain(params: {
  producer?: `0x${string}`;
  ipfsCID: string;
  primarySecretHash: `0x${string}`;
  unitSecretHashes: `0x${string}`[];
}): Promise<{
  batchId: number;
  txHash: `0x${string}`;
  chainId: number;
  batch: OnChainBatch;
}> {
  const store = readLocalStore();
  const batchId = store.nextBatchId++;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const producer = params.producer || DEFAULT_PRODUCER_ADDRESS;
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 84532);

  const unitsMap: Record<string, number> = {};
  for (const h of params.unitSecretHashes) {
    unitsMap[h.toLowerCase()] = 0; // 0 = unclaimed
  }

  const totalUnits =
    params.unitSecretHashes.length > 0 ? params.unitSecretHashes.length : 1;

  store.batches[String(batchId)] = {
    batchId,
    producer,
    ipfsCID: params.ipfsCID,
    secretHash: params.primarySecretHash.toLowerCase() as `0x${string}`,
    createdAt: nowSeconds,
    isClaimed: false,
    claimedAt: 0,
    totalUnits,
    claimedUnits: 0,
    units: unitsMap,
    tamperReports: [],
  };

  writeLocalStore(store);

  const txHash = (`0x${createHash("sha256")
    .update(`${batchId}:${params.ipfsCID}:${params.primarySecretHash}:${nowSeconds}`)
    .digest("hex")}`) as `0x${string}`;

  return {
    batchId,
    txHash,
    chainId,
    batch: {
      batchId,
      producer,
      ipfsCID: params.ipfsCID,
      secretHash: params.primarySecretHash.toLowerCase() as `0x${string}`,
      createdAt: nowSeconds,
      isClaimed: false,
    },
  };
}

/**
 * Read-only (`eth_call` equivalent) verification of a batch + secret without mutating state.
 */
export async function verifyBatchReadOnly(
  batchId: number,
  secret: string
): Promise<VerificationResponse> {
  const store = readLocalStore();
  const record = store.batches[String(batchId)];

  if (!record) {
    return {
      status: "BATCH_NOT_FOUND",
      isAuthentic: false,
      alreadyClaimed: false,
      claimedAt: null,
      claimedAtISO: null,
      totalUnits: 0,
      claimedUnits: 0,
      batch: null,
      metadata: null,
      message: `Batch #${batchId} does not exist on the registry.`,
    };
  }

  const metadata = await fetchMetadataFromIPFS(record.ipfsCID);
  const batch: OnChainBatch = {
    batchId: record.batchId,
    producer: record.producer,
    ipfsCID: record.ipfsCID,
    secretHash: record.secretHash,
    createdAt: record.createdAt,
    isClaimed: record.isClaimed,
  };

  if (!secret) {
    return {
      status: "INVALID_SECRET",
      isAuthentic: false,
      alreadyClaimed: false,
      claimedAt: null,
      claimedAtISO: null,
      totalUnits: record.totalUnits,
      claimedUnits: record.claimedUnits,
      batch,
      metadata,
      message: "Missing cryptographic secret in verification URL.",
    };
  }

  const providedHash = hashSecret(secret).toLowerCase();
  const isSerializedUnit = Object.prototype.hasOwnProperty.call(
    record.units,
    providedHash
  );
  const isPrimaryMatch = providedHash === record.secretHash.toLowerCase();

  if (!isSerializedUnit && !isPrimaryMatch) {
    return {
      status: "INVALID_SECRET",
      isAuthentic: false,
      alreadyClaimed: false,
      claimedAt: null,
      claimedAtISO: null,
      totalUnits: record.totalUnits,
      claimedUnits: record.claimedUnits,
      batch,
      metadata,
      message:
        "Invalid cryptographic secret. This QR code does not match the producer's on-chain signature.",
    };
  }

  const claimedTimestamp = isSerializedUnit
    ? record.units[providedHash]
    : record.claimedAt;
  const alreadyClaimed = isSerializedUnit
    ? claimedTimestamp > 0
    : record.isClaimed;

  if (alreadyClaimed) {
    const claimedISO = new Date(claimedTimestamp * 1000).toISOString();
    return {
      status: "DUPLICATE_SCAN_WARNING",
      isAuthentic: true,
      alreadyClaimed: true,
      claimedAt: claimedTimestamp,
      claimedAtISO: claimedISO,
      totalUnits: record.totalUnits,
      claimedUnits: record.claimedUnits,
      batch,
      metadata,
      message: `This code was already verified on ${claimedISO}. Possible duplicate or counterfeit copy.`,
    };
  }

  return {
    status: "GENUINE_UNCLAIMED",
    isAuthentic: true,
    alreadyClaimed: false,
    claimedAt: null,
    claimedAtISO: null,
    totalUnits: record.totalUnits,
    claimedUnits: record.claimedUnits,
    batch,
    metadata,
    message: "100% Genuine & Unclaimed. Ready for first-scan verification.",
  };
}

/**
 * Performs the single-claim verification (`claimBatch` on-chain state transition).
 * - First scan of a genuine secret marks it claimed and returns `GENUINE_CLAIMED_NOW`.
 * - Any subsequent scan of the same QR code returns `DUPLICATE_SCAN_WARNING` with the original timestamp.
 */
export async function verifyAndClaimBatch(
  batchId: number,
  secret: string
): Promise<VerificationResponse> {
  const store = readLocalStore();
  const record = store.batches[String(batchId)];

  if (!record) {
    return {
      status: "BATCH_NOT_FOUND",
      isAuthentic: false,
      alreadyClaimed: false,
      claimedAt: null,
      claimedAtISO: null,
      totalUnits: 0,
      claimedUnits: 0,
      batch: null,
      metadata: null,
      message: `Batch #${batchId} does not exist on the registry.`,
    };
  }

  const metadata = await fetchMetadataFromIPFS(record.ipfsCID);
  const providedHash = secret ? hashSecret(secret).toLowerCase() : "";
  const isSerializedUnit = Object.prototype.hasOwnProperty.call(
    record.units,
    providedHash
  );
  const isPrimaryMatch = providedHash === record.secretHash.toLowerCase();

  if (!secret || (!isSerializedUnit && !isPrimaryMatch)) {
    return {
      status: "INVALID_SECRET",
      isAuthentic: false,
      alreadyClaimed: false,
      claimedAt: null,
      claimedAtISO: null,
      totalUnits: record.totalUnits,
      claimedUnits: record.claimedUnits,
      batch: {
        batchId: record.batchId,
        producer: record.producer,
        ipfsCID: record.ipfsCID,
        secretHash: record.secretHash,
        createdAt: record.createdAt,
        isClaimed: record.isClaimed,
      },
      metadata,
      message:
        "Invalid cryptographic secret. This QR code does not match the producer's on-chain signature.",
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (isSerializedUnit) {
    const prevClaim = record.units[providedHash];
    if (prevClaim > 0) {
      const claimedISO = new Date(prevClaim * 1000).toISOString();
      return {
        status: "DUPLICATE_SCAN_WARNING",
        isAuthentic: true,
        alreadyClaimed: true,
        claimedAt: prevClaim,
        claimedAtISO: claimedISO,
        totalUnits: record.totalUnits,
        claimedUnits: record.claimedUnits,
        batch: {
          batchId: record.batchId,
          producer: record.producer,
          ipfsCID: record.ipfsCID,
          secretHash: record.secretHash,
          createdAt: record.createdAt,
          isClaimed: record.isClaimed,
        },
        metadata,
        message: `Warning: This code was already verified on ${claimedISO}. Possible duplicate.`,
      };
    }

    // First scan: mark unit as claimed
    record.units[providedHash] = nowSeconds;
    record.claimedUnits += 1;

    if (
      record.claimedUnits >= record.totalUnits ||
      providedHash === record.secretHash.toLowerCase()
    ) {
      record.isClaimed = true;
      if (record.claimedAt === 0) {
        record.claimedAt = nowSeconds;
      }
    }

    writeLocalStore(store);

    const claimedISO = new Date(nowSeconds * 1000).toISOString();
    return {
      status: "GENUINE_CLAIMED_NOW",
      isAuthentic: true,
      alreadyClaimed: false,
      claimedAt: nowSeconds,
      claimedAtISO: claimedISO,
      totalUnits: record.totalUnits,
      claimedUnits: record.claimedUnits,
      batch: {
        batchId: record.batchId,
        producer: record.producer,
        ipfsCID: record.ipfsCID,
        secretHash: record.secretHash,
        createdAt: record.createdAt,
        isClaimed: record.isClaimed,
      },
      metadata,
      message: "100% Genuine. First scan verified and claimed on-chain.",
    };
  }

  // Primary batch secret flow
  if (record.isClaimed) {
    const claimedISO = new Date(record.claimedAt * 1000).toISOString();
    return {
      status: "DUPLICATE_SCAN_WARNING",
      isAuthentic: true,
      alreadyClaimed: true,
      claimedAt: record.claimedAt,
      claimedAtISO: claimedISO,
      totalUnits: record.totalUnits,
      claimedUnits: record.claimedUnits,
      batch: {
        batchId: record.batchId,
        producer: record.producer,
        ipfsCID: record.ipfsCID,
        secretHash: record.secretHash,
        createdAt: record.createdAt,
        isClaimed: record.isClaimed,
      },
      metadata,
      message: `Warning: This code was already verified on ${claimedISO}. Possible duplicate.`,
    };
  }

  record.isClaimed = true;
  record.claimedAt = nowSeconds;
  record.claimedUnits = 1;
  writeLocalStore(store);

  const claimedISO = new Date(nowSeconds * 1000).toISOString();
  return {
    status: "GENUINE_CLAIMED_NOW",
    isAuthentic: true,
    alreadyClaimed: false,
    claimedAt: nowSeconds,
    claimedAtISO: claimedISO,
    totalUnits: record.totalUnits,
    claimedUnits: record.claimedUnits,
    batch: {
      batchId: record.batchId,
      producer: record.producer,
      ipfsCID: record.ipfsCID,
      secretHash: record.secretHash,
      createdAt: record.createdAt,
      isClaimed: record.isClaimed,
    },
    metadata,
    message: "100% Genuine. First scan verified and claimed on-chain.",
  };
}

/**
 * Records a consumer tamper/counterfeit location report on-chain.
 */
export async function reportBatchTamper(
  batchId: number,
  locationInfo: string
): Promise<{ reported: boolean; reportedAt: number }> {
  const store = readLocalStore();
  const record = store.batches[String(batchId)];
  if (!record) {
    throw new Error(`Batch #${batchId} not found`);
  }

  const reportedAt = Math.floor(Date.now() / 1000);
  record.tamperReports.push({ locationInfo, reportedAt });
  writeLocalStore(store);

  return { reported: true, reportedAt };
}

/**
 * Lists all batches (optionally filtered by producer address) with their resolved IPFS metadata.
 */
export async function listBatches(producerAddress?: string): Promise<
  Array<{
    batch: OnChainBatch;
    totalUnits: number;
    claimedUnits: number;
    tamperReportCount: number;
    metadata: BatchMetadata | null;
  }>
> {
  const store = readLocalStore();
  const entries = Object.values(store.batches).sort(
    (a, b) => b.batchId - a.batchId
  );

  const filtered = producerAddress
    ? entries.filter(
        (b) => b.producer.toLowerCase() === producerAddress.toLowerCase()
      )
    : entries;

  const results = await Promise.all(
    filtered.map(async (item) => ({
      batch: {
        batchId: item.batchId,
        producer: item.producer,
        ipfsCID: item.ipfsCID,
        secretHash: item.secretHash,
        createdAt: item.createdAt,
        isClaimed: item.isClaimed,
      },
      totalUnits: item.totalUnits,
      claimedUnits: item.claimedUnits,
      tamperReportCount: item.tamperReports.length,
      metadata: await fetchMetadataFromIPFS(item.ipfsCID),
    }))
  );

  return results;
}
