import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { join } from "node:path";
import {
  createAndAnchorBatch,
  listBatches,
  reportBatchTamper,
  verifyAndClaimBatch,
  verifyBatchReadOnly,
} from "../batch-service";
import { hashSecret } from "../crypto";

async function runBackendTests() {
  const storePath = join(process.cwd(), ".batchsnap-dev-store.json");
  rmSync(storePath, { force: true });

  console.log("1. Testing Ethereum Keccak-256 vector compatibility...");
  const emptyKeccak = hashSecret("");
  assert.equal(
    emptyKeccak,
    "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "Keccak-256 of empty string must match Ethereum standard vector"
  );

  console.log("2. Testing createAndAnchorBatch (IPFS pin + serialized QR generation + L2 anchor)...");
  const created = await createAndAnchorBatch(
    {
      productName: "Cederberg Raw Fynbos Honey",
      category: "honey",
      producerName: "Cederberg Apiaries Co-op",
      originRegion: "Western Cape, South Africa",
      harvestOrProductionDate: "2026-09-15",
      unitCount: 30,
      attributes: [
        { trait_type: "Lab Certificate", value: "MGO 400+ Verified" },
        { trait_type: "Moisture", value: "16.8%" },
      ],
    },
    "https://batchsnap.app"
  );

  assert.equal(created.batchId, 1001);
  assert.equal(created.labels.length, 30);
  assert.ok(created.ipfsCID.startsWith("bafkrei"));
  assert.match(
    created.labels[0].verifyUrl,
    /^https:\/\/batchsnap\.app\/v\/1001\?secret=[0-9a-f]{8}$/
  );

  const jar1Secret = created.labels[0].secret;
  const jar2Secret = created.labels[1].secret;

  console.log("3. Testing read-only verification before first consumer scan...");
  const preScan = await verifyBatchReadOnly(created.batchId, jar1Secret);
  assert.equal(preScan.status, "GENUINE_UNCLAIMED");
  assert.equal(preScan.isAuthentic, true);
  assert.equal(preScan.alreadyClaimed, false);
  assert.equal(preScan.metadata?.productName, "Cederberg Raw Fynbos Honey");

  console.log("4. Testing first consumer scan (single-claim state transition)...");
  const firstClaim = await verifyAndClaimBatch(created.batchId, jar1Secret);
  assert.equal(firstClaim.status, "GENUINE_CLAIMED_NOW");
  assert.equal(firstClaim.isAuthentic, true);
  assert.equal(firstClaim.alreadyClaimed, false);
  assert.equal(firstClaim.claimedUnits, 1);

  console.log("5. Testing counterfeit duplicate scan detection on cloned QR label...");
  const duplicateScan = await verifyAndClaimBatch(created.batchId, jar1Secret);
  assert.equal(duplicateScan.status, "DUPLICATE_SCAN_WARNING");
  assert.equal(duplicateScan.isAuthentic, true);
  assert.equal(duplicateScan.alreadyClaimed, true);
  assert.ok(duplicateScan.claimedAt && duplicateScan.claimedAt > 0);

  console.log("6. Testing independent serialized unit #2 in the same batch...");
  const secondJarClaim = await verifyAndClaimBatch(created.batchId, jar2Secret);
  assert.equal(secondJarClaim.status, "GENUINE_CLAIMED_NOW");
  assert.equal(secondJarClaim.claimedUnits, 2);

  console.log("7. Testing tampered/forged QR secret rejection...");
  const forgedScan = await verifyAndClaimBatch(created.batchId, "deadbeef");
  assert.equal(forgedScan.status, "INVALID_SECRET");
  assert.equal(forgedScan.isAuthentic, false);

  console.log("8. Testing consumer tamper reporting & batch listing...");
  const report = await reportBatchTamper(
    created.batchId,
    "Counterfeit jar spotted at informal market stall"
  );
  assert.equal(report.reported, true);

  const allBatches = await listBatches();
  assert.equal(allBatches.length, 1);
  assert.equal(allBatches[0].claimedUnits, 2);
  assert.equal(allBatches[0].tamperReportCount, 1);

  rmSync(storePath, { force: true });
  console.log("\n✅ All BatchSnap backend tests passed!");
}

runBackendTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
