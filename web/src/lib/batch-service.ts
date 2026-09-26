import {
  anchorBatchOnChain,
  listBatches,
  peekNextBatchId,
  reportBatchTamper,
  verifyAndClaimBatch,
  verifyBatchReadOnly,
} from "./contract";
import { generateSerializedLabels } from "./crypto";
import { pinMetadataToIPFS } from "./ipfs";
import type {
  BatchMetadata,
  CreateBatchRequest,
  CreateBatchResponse,
} from "./types";

const DEFAULT_PRODUCER_ADDRESS =
  "0x71C95911E9a5D330f4D621842EC243EE1343292e" as `0x${string}`;

/**
 * Full 60-second producer backend pipeline:
 * 1. Builds canonical BatchMetadata JSON and pins it to IPFS (Pinata or local dev store)
 * 2. Generates `unitCount` unique QR secrets & `keccak256` hashes
 * 3. Anchors `(ipfsCID, primarySecretHash, unitSecretHashes)` on the Layer 2 BatchRegistry
 * 4. Returns the batch record and print-ready serialized QR label URLs
 */
export async function createAndAnchorBatch(
  input: CreateBatchRequest,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
): Promise<CreateBatchResponse> {
  if (!input.productName?.trim()) {
    throw new Error("productName is required");
  }
  if (!input.producerName?.trim()) {
    throw new Error("producerName is required");
  }
  if (!input.originRegion?.trim()) {
    throw new Error("originRegion is required");
  }

  const unitCount = Math.max(1, Math.min(Number(input.unitCount || 1), 500));
  const nextBatchId = peekNextBatchId();
  const producerAddress = input.producerAddress || DEFAULT_PRODUCER_ADDRESS;

  const metadata: BatchMetadata = {
    schemaVersion: "1.0.0",
    productName: input.productName.trim(),
    category: input.category || "other",
    producerName: input.producerName.trim(),
    producerAddress,
    originRegion: input.originRegion.trim(),
    coordinates: input.coordinates,
    harvestOrProductionDate:
      input.harvestOrProductionDate || new Date().toISOString().slice(0, 10),
    batchCode: input.batchCode?.trim() || `BS-${nextBatchId}`,
    unitCount,
    imageCID: input.imageCID,
    labCertificateCID: input.labCertificateCID,
    storyNote: input.storyNote,
    attributes: input.attributes || [],
    createdAtISO: new Date().toISOString(),
  };

  // 1. Pin metadata to IPFS
  const { cid: ipfsCID } = await pinMetadataToIPFS(metadata);

  // 2. Generate serialized QR secrets & keccak256 hashes for each label unit
  const labels = generateSerializedLabels(nextBatchId, unitCount, baseUrl);
  const primarySecretHash = labels[0].secretHash;
  const unitSecretHashes = labels.map((l) => l.secretHash);

  // 3. Anchor CID + secret hashes on-chain
  const anchored = await anchorBatchOnChain({
    producer: producerAddress,
    ipfsCID,
    primarySecretHash,
    unitSecretHashes,
  });

  return {
    batchId: anchored.batchId,
    ipfsCID,
    txHash: anchored.txHash,
    chainId: anchored.chainId,
    batch: anchored.batch,
    metadata,
    labels,
  };
}

export {
  listBatches,
  reportBatchTamper,
  verifyAndClaimBatch,
  verifyBatchReadOnly,
};
