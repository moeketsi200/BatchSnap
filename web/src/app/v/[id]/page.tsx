"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { VerificationResponse } from "@/lib/types";

function VerificationContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const batchId = params?.id || "";
  const secret = searchParams?.get("secret") || "";

  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<VerificationResponse | null>(
    null
  );
  const [reportLocation, setReportLocation] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const executeClaimCheck = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/verify/${batchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, action: "claim" }),
      });
      const data = (await res.json()) as VerificationResponse;
      setVerification(data);
    } catch {
      setVerification(null);
    } finally {
      setLoading(false);
    }
  }, [batchId, secret]);

  useEffect(() => {
    executeClaimCheck();
  }, [executeClaimCheck]);

  const handleReportTamper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !reportLocation.trim()) return;
    await fetch(`/api/verify/${batchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "report_tamper",
        locationInfo: reportLocation.trim(),
      }),
    });
    setReportSent(true);
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-200">
          Querying Layer 2 BatchRegistry Contract…
        </p>
        <p className="mt-1 font-mono text-xs text-slate-400">
          Batch #{batchId} • Free Read/Claim Verification
        </p>
      </main>
    );
  }

  const isGenuineFirstScan = verification?.status === "GENUINE_CLAIMED_NOW";
  const isDuplicateWarning = verification?.status === "DUPLICATE_SCAN_WARNING";

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
        >
          ← Producer Dashboard
        </Link>
        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-[11px] text-slate-400">
          Batch #{batchId}
        </span>
      </div>

      {isGenuineFirstScan && (
        <section className="rounded-3xl border-2 border-emerald-500/60 bg-emerald-950/30 p-6 text-center shadow-2xl shadow-emerald-950/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-slate-950 font-black shadow-lg shadow-emerald-500/30">
            ✓
          </div>
          <span className="mt-3 inline-block rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
            100% Genuine • First Scan Claimed
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            Authentic Origin Verified
          </h1>
          <p className="mt-1 text-xs text-emerald-200/90 leading-relaxed">
            This unit&apos;s cryptographic secret (<code className="font-mono">{secret}</code>)
            matched the producer&apos;s on-chain signature and has now been claimed
            on this scan.
          </p>

          <button
            type="button"
            onClick={executeClaimCheck}
            className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            🔁 Simulate 2nd Scan (Test Counterfeit Duplicate Warning)
          </button>
        </section>
      )}

      {isDuplicateWarning && (
        <section className="rounded-3xl border-2 border-amber-500/70 bg-amber-950/30 p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-3xl text-slate-950 font-black">
            ⚠️
          </div>
          <span className="mt-3 inline-block rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300">
            Security Alert • Code Previously Scanned
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            Possible Duplicate / Counterfeit
          </h1>
          <p className="mt-2 text-xs text-amber-200 leading-relaxed">
            This QR code was already verified on{" "}
            <strong className="underline">
              {verification?.claimedAtISO
                ? new Date(verification.claimedAtISO).toLocaleString()
                : "an earlier scan"}
            </strong>
            . If you just unsealed this item for the first time, it may be a
            cloned counterfeit label.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-slate-950/80 p-4 text-left">
            <p className="text-xs font-bold text-amber-300">
              🛡️ Report Suspected Counterfeit Retail Location
            </p>
            {reportSent ? (
              <p className="mt-2 text-xs text-emerald-400">
                ✓ Tamper alert recorded on-chain for the producer.
              </p>
            ) : (
              <form onSubmit={handleReportTamper} className="mt-2 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Store name or city where purchased..."
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  Flag
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {!isGenuineFirstScan && !isDuplicateWarning && (
        <section className="rounded-3xl border-2 border-red-500/70 bg-red-950/30 p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-3xl text-white font-black">
            ✕
          </div>
          <span className="mt-3 inline-block rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-red-300">
            Verification Failed
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            Unrecognized or Tampered QR Code
          </h1>
          <p className="mt-2 text-xs text-red-200">
            {verification?.message ||
              "This QR code does not match any authentic batch secret on the registry."}
          </p>
        </section>
      )}

      {verification?.metadata && verification.batch && (
        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              {verification.metadata.producerName}
            </span>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              {verification.metadata.productName}
            </h2>
            {verification.metadata.storyNote && (
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                &ldquo;{verification.metadata.storyNote}&rdquo;
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3">
              <span className="text-slate-500 block">Origin Region</span>
              <strong className="text-slate-100 mt-0.5 block">
                {verification.metadata.originRegion}
              </strong>
            </div>

            <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3">
              <span className="text-slate-500 block">Harvest / Batch Date</span>
              <strong className="text-slate-100 mt-0.5 block">
                {verification.metadata.harvestOrProductionDate}
              </strong>
            </div>

            <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3">
              <span className="text-slate-500 block">Batch Code</span>
              <strong className="font-mono text-slate-100 mt-0.5 block">
                {verification.metadata.batchCode}
              </strong>
            </div>

            <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3">
              <span className="text-slate-500 block">Batch Units Claimed</span>
              <strong className="font-mono text-emerald-400 mt-0.5 block">
                {verification.claimedUnits} of {verification.totalUnits} units
              </strong>
            </div>
          </div>

          {verification.metadata.attributes.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Lab Certificates &amp; Quality Specs
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {verification.metadata.attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs"
                  >
                    <span className="text-slate-400">{attr.trait_type}</span>
                    <span className="font-semibold text-emerald-300">
                      {attr.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950 p-3.5 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Producer Signer:</span>
              <span className="text-slate-200">
                {verification.batch.producer.slice(0, 10)}…
                {verification.batch.producer.slice(-6)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>IPFS Metadata CID:</span>
              <span className="text-emerald-400">
                {verification.batch.ipfsCID.slice(0, 18)}…
              </span>
            </div>
            <div className="flex justify-between">
              <span>Keccak256 Secret Hash:</span>
              <span className="text-slate-300">
                {verification.batch.secretHash.slice(0, 14)}…
              </span>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default function ConsumerVerificationPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-200">
            Loading Verification Portal…
          </p>
        </main>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
