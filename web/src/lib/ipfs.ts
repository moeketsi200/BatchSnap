import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BatchMetadata } from "./types.ts";

const LOCAL_STORE_PATH = join(process.cwd(), ".batchsnap-dev-store.json");

interface LocalDevStore {
  ipfs: Record<string, BatchMetadata>;
  nextBatchId: number;
  batches: Record<
    string,
    {
      batchId: number;
      producer: `0x${string}`;
      ipfsCID: string;
      secretHash: `0x${string}`;
      createdAt: number;
      isClaimed: boolean;
      claimedAt: number;
      totalUnits: number;
      claimedUnits: number;
      units: Record<string, number>; // unitSecretHash => claimedTimestamp (0 if unclaimed)
      tamperReports: Array<{ locationInfo: string; reportedAt: number }>;
    }
  >;
}

export function readLocalStore(): LocalDevStore {
  try {
    if (existsSync(LOCAL_STORE_PATH)) {
      const raw = readFileSync(LOCAL_STORE_PATH, "utf-8");
      return JSON.parse(raw) as LocalDevStore;
    }
  } catch {
    // Fallback to fresh store if corrupted
  }
  return {
    ipfs: {},
    nextBatchId: 1001,
    batches: {},
  };
}

export function writeLocalStore(store: LocalDevStore): void {
  writeFileSync(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

/**
 * Computes a deterministic CID-like identifier (`bafkrei...`) from JSON content
 * for local/offline development when `PINATA_JWT` is not configured.
 */
function computeLocalCID(content: string): string {
  const sha256Hex = createHash("sha256").update(content).digest("hex");
  return `bafkrei${sha256Hex.slice(0, 52)}`;
}

/**
 * Pins BatchMetadata JSON to IPFS via Pinata API (or stores locally in dev mode).
 */
export async function pinMetadataToIPFS(
  metadata: BatchMetadata
): Promise<{ cid: string; gatewayUrl: string; isLocalFallback: boolean }> {
  const serialized = JSON.stringify(metadata);
  const pinataJwt = process.env.PINATA_JWT;

  if (pinataJwt && pinataJwt !== "your_pinata_jwt_here") {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataMetadata: {
          name: `batchsnap-${metadata.productName}-${metadata.batchCode}`,
        },
        pinataContent: metadata,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Pinata IPFS upload failed (${response.status}): ${errText}`);
    }

    const result = (await response.json()) as { IpfsHash: string };
    const cid = result.IpfsHash;

    // Also cache locally for fast reads
    const store = readLocalStore();
    store.ipfs[cid] = metadata;
    writeLocalStore(store);

    return {
      cid,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
      isLocalFallback: false,
    };
  }

  // Local deterministic CID fallback when PINATA_JWT is not set
  const cid = computeLocalCID(serialized);
  const store = readLocalStore();
  store.ipfs[cid] = metadata;
  writeLocalStore(store);

  return {
    cid,
    gatewayUrl: `/api/ipfs/${cid}`,
    isLocalFallback: true,
  };
}

/**
 * Resolves `BatchMetadata` from local cache or public IPFS gateway.
 */
export async function fetchMetadataFromIPFS(
  cid: string
): Promise<BatchMetadata | null> {
  if (!cid) return null;

  const store = readLocalStore();
  if (store.ipfs[cid]) {
    return store.ipfs[cid];
  }

  // If not in local cache, fetch from public IPFS gateway
  const gatewayBase =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";
  try {
    const res = await fetch(`${gatewayBase.replace(/\/+$/, "")}/${cid}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as BatchMetadata;
    return data;
  } catch {
    return null;
  }
}
