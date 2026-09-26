import { hashSecret } from "./crypto";
import { prisma } from "./db";
import { fetchMetadataFromIPFS } from "./ipfs";
import type { BatchMetadata, OnChainBatch, VerificationResponse } from "./types";

/**
 * MOCK SMART CONTRACT ABSTRACTION (Powered by SQLite via Prisma)
 * In production, this layer is replaced by viem/ethers calling Layer 2.
 */

// Simulated next batch ID using DB MAX + 1
export async function peekNextBatchId(): Promise<number> {
  const aggr = await prisma.batch.aggregate({
    _max: { batchId: true }
  });
  const maxId = aggr._max.batchId || 1000;
  return maxId + 1;
}

export async function anchorBatchOnChain(input: {
  producer: `0x${string}`;
  ipfsCID: string;
  primarySecretHash: string;
  unitSecretHashes: string[];
}): Promise<{
  batchId: number;
  txHash: string;
  chainId: number;
  batch: OnChainBatch;
}> {
  const batchId = await peekNextBatchId();
  const nowSeconds = Math.floor(Date.now() / 1000);
  
  // Wrap in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.batch.create({
      data: {
        batchId,
        producer: input.producer,
        ipfsCID: input.ipfsCID,
        secretHash: input.primarySecretHash,
        createdAt: nowSeconds,
        totalUnits: input.unitSecretHashes.length,
      }
    });

    const unitData = input.unitSecretHashes.map((hash) => ({
      secretHash: hash.toLowerCase(),
      batchId,
    }));
    
    // Prisma bulk create
    await tx.unit.createMany({
      data: unitData,
      skipDuplicates: true
    });
  });

  const batchState: OnChainBatch = {
    batchId,
    producer: input.producer,
    ipfsCID: input.ipfsCID,
    secretHash: input.primarySecretHash,
    createdAt: nowSeconds,
    isClaimed: false,
  };

  return {
    batchId,
    txHash: `0x${Buffer.from(Math.random().toString()).toString("hex")}`,
    chainId: 84532,
    batch: batchState,
  };
}

export async function verifyBatchReadOnly(
  batchId: number,
  secret?: string
): Promise<VerificationResponse> {
  const record = await prisma.batch.findUnique({
    where: { batchId },
    include: { units: true }
  });

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
  
  const unitRecord = record.units.find(u => u.secretHash === providedHash);
  const isSerializedUnit = !!unitRecord;
  const isPrimaryMatch = providedHash === record.secretHash.toLowerCase();

  const batchState: OnChainBatch = {
    batchId: record.batchId,
    producer: record.producer as `0x${string}`,
    ipfsCID: record.ipfsCID,
    secretHash: record.secretHash,
    createdAt: record.createdAt,
    isClaimed: record.isClaimed,
  };

  if (!secret || (!isSerializedUnit && !isPrimaryMatch)) {
    return {
      status: "INVALID_SECRET",
      isAuthentic: false,
      alreadyClaimed: false,
      claimedAt: null,
      claimedAtISO: null,
      totalUnits: record.totalUnits,
      claimedUnits: record.claimedUnits,
      batch: batchState,
      metadata,
      message: "Invalid cryptographic secret.",
    };
  }

  const claimedTimestamp = isSerializedUnit ? unitRecord.claimedAt : record.claimedAt;
  const alreadyClaimed = isSerializedUnit ? claimedTimestamp > 0 : record.isClaimed;

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
      batch: batchState,
      metadata,
      message: `This code was already verified on ${claimedISO}.`,
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
    batch: batchState,
    metadata,
    message: "100% Genuine & Unclaimed.",
  };
}

export async function verifyAndClaimBatch(
  batchId: number,
  secret: string
): Promise<VerificationResponse> {
  // Read first
  const readRes = await verifyBatchReadOnly(batchId, secret);
  if (!readRes.isAuthentic || readRes.alreadyClaimed) {
    return readRes;
  }

  const providedHash = hashSecret(secret).toLowerCase();
  const nowSeconds = Math.floor(Date.now() / 1000);
  
  await prisma.$transaction(async (tx) => {
    const record = await tx.batch.findUnique({
      where: { batchId },
      include: { units: true }
    });
    if (!record) throw new Error("Batch not found in TX");

    const unitRecord = record.units.find(u => u.secretHash === providedHash);
    const isSerializedUnit = !!unitRecord;

    if (isSerializedUnit) {
      await tx.unit.update({
        where: { secretHash: providedHash },
        data: { claimedAt: nowSeconds }
      });
      
      const newClaimedUnits = record.claimedUnits + 1;
      const willBeFullyClaimed = newClaimedUnits >= record.totalUnits || providedHash === record.secretHash.toLowerCase();

      await tx.batch.update({
        where: { batchId },
        data: {
          claimedUnits: newClaimedUnits,
          isClaimed: willBeFullyClaimed ? true : record.isClaimed,
          claimedAt: willBeFullyClaimed && record.claimedAt === 0 ? nowSeconds : record.claimedAt,
        }
      });
    } else {
      // Primary batch hash
      await tx.batch.update({
        where: { batchId },
        data: {
          isClaimed: true,
          claimedAt: nowSeconds,
          claimedUnits: Math.max(record.claimedUnits, 1)
        }
      });
    }
  });

  // Re-read to get updated state
  const finalRes = await verifyBatchReadOnly(batchId, secret);
  finalRes.status = "GENUINE_CLAIMED_NOW";
  finalRes.message = "100% Genuine. First scan verified and claimed on-chain.";
  return finalRes;
}

export async function reportBatchTamper(
  batchId: number,
  locationInfo: string
): Promise<{ reported: boolean; reportedAt: number }> {
  const reportedAt = Math.floor(Date.now() / 1000);
  await prisma.tamperReport.create({
    data: {
      batchId,
      locationInfo,
      reportedAt
    }
  });
  return { reported: true, reportedAt };
}

export async function listBatches(producerAddress?: string): Promise<
  Array<{
    batch: OnChainBatch;
    totalUnits: number;
    claimedUnits: number;
    tamperReportCount: number;
    metadata: BatchMetadata | null;
  }>
> {
  const filter = producerAddress ? { producer: producerAddress } : {};
  const entries = await prisma.batch.findMany({
    where: filter,
    orderBy: { batchId: 'desc' },
    include: {
      _count: {
        select: { tamperReports: true }
      }
    }
  });

  const results = await Promise.all(
    entries.map(async (item) => ({
      batch: {
        batchId: item.batchId,
        producer: item.producer as `0x${string}`,
        ipfsCID: item.ipfsCID,
        secretHash: item.secretHash,
        createdAt: item.createdAt,
        isClaimed: item.isClaimed,
      },
      totalUnits: item.totalUnits,
      claimedUnits: item.claimedUnits,
      tamperReportCount: item._count.tamperReports,
      metadata: await fetchMetadataFromIPFS(item.ipfsCID),
    }))
  );

  return results;
}
