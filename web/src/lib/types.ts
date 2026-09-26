export type ProductCategory =
  | "coffee"
  | "honey"
  | "olive-oil"
  | "cosmetics"
  | "wine-spirits"
  | "other";

export type LabelTemplateType =
  | "avery-5160" // 30 per sheet (1" x 2-5/8")
  | "avery-5163" // 10 per sheet (2" x 4")
  | "thermal-roll"; // 2" x 2" continuous roll

export interface BatchAttribute {
  trait_type: string;
  value: string;
}

/**
 * Off-chain JSON payload pinned to IPFS and referenced by `Batch.ipfsCID` on-chain.
 */
export interface BatchMetadata {
  schemaVersion: "1.0.0";
  productName: string;
  category: ProductCategory;
  producerName: string;
  producerAddress: string;
  originRegion: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  harvestOrProductionDate: string;
  batchCode: string;
  unitCount: number;
  imageCID?: string;
  labCertificateCID?: string;
  storyNote?: string;
  attributes: BatchAttribute[];
  createdAtISO: string;
}

/**
 * Single physical sticker/label generated for a batch unit.
 */
export interface SerializedLabelUnit {
  unitNumber: number;
  secret: string;
  secretHash: `0x${string}`;
  verifyUrl: string;
}

/**
 * Mirrors the on-chain `BatchRegistry.Batch` struct in Solidity.
 */
export interface OnChainBatch {
  batchId: number;
  producer: `0x${string}`;
  ipfsCID: string;
  secretHash: `0x${string}`;
  createdAt: number;
  isClaimed: boolean;
}

/**
 * Mirrors the on-chain `BatchRegistry.VerificationResult` struct in Solidity.
 */
export interface OnChainVerificationResult {
  isAuthentic: boolean;
  alreadyClaimed: boolean;
  claimedAt: number;
  totalUnits: number;
  claimedUnits: number;
  batch: OnChainBatch;
}

export type VerificationStatusCode =
  | "GENUINE_UNCLAIMED"
  | "GENUINE_CLAIMED_NOW"
  | "DUPLICATE_SCAN_WARNING"
  | "INVALID_SECRET"
  | "BATCH_NOT_FOUND";

export interface VerificationResponse {
  status: VerificationStatusCode;
  isAuthentic: boolean;
  alreadyClaimed: boolean;
  claimedAt: number | null;
  claimedAtISO: string | null;
  totalUnits: number;
  claimedUnits: number;
  batch: OnChainBatch | null;
  metadata: BatchMetadata | null;
  message: string;
}

export interface CreateBatchRequest {
  productName: string;
  category: ProductCategory;
  producerName: string;
  producerAddress?: `0x${string}`;
  originRegion: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  harvestOrProductionDate: string;
  batchCode?: string;
  unitCount: number;
  labelTemplate?: LabelTemplateType;
  imageCID?: string;
  labCertificateCID?: string;
  storyNote?: string;
  attributes?: BatchAttribute[];
}

export interface CreateBatchResponse {
  batchId: number;
  ipfsCID: string;
  txHash: `0x${string}`;
  chainId: number;
  batch: OnChainBatch;
  metadata: BatchMetadata;
  labels: SerializedLabelUnit[];
}
