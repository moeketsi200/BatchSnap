import { createHash } from "node:crypto";
import { prisma } from "./db";
import type { BatchMetadata } from "./types";

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

  let cid: string;
  let gatewayUrl: string;
  let isLocalFallback: boolean;

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
    cid = result.IpfsHash;
    gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    isLocalFallback = false;
  } else {
    // Local deterministic CID fallback when PINATA_JWT is not set
    cid = computeLocalCID(serialized);
    gatewayUrl = `/api/ipfs/${cid}`;
    isLocalFallback = true;
  }

  // Cache locally for fast reads (SQLite)
  await prisma.ipfsMetadata.upsert({
    where: { cid },
    update: { metadata: serialized },
    create: { cid, metadata: serialized },
  });

  return { cid, gatewayUrl, isLocalFallback };
}

/**
 * Resolves `BatchMetadata` from local SQLite cache or public IPFS gateway.
 */
export async function fetchMetadataFromIPFS(
  cid: string
): Promise<BatchMetadata | null> {
  if (!cid) return null;

  const localRecord = await prisma.ipfsMetadata.findUnique({ where: { cid } });
  if (localRecord) {
    try {
      return JSON.parse(localRecord.metadata) as BatchMetadata;
    } catch {
      // Ignore JSON parse errors
    }
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
