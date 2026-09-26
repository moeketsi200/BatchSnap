"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  AwardIcon,
  Building2Icon,
  CalendarIcon,
  DatabaseIcon,
  FileTextIcon,
  FlagIcon,
  FlaskConicalIcon,
  Link2Icon,
  LockIcon,
  MapPinIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  TagIcon,
} from "@/components/LucideIcons";
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1B4332] border-t-transparent" />
        <p className="mt-4 text-sm font-bold text-slate-200">
          Verifying Cryptographic Origin Seal…
        </p>
        <p className="mt-1 font-mono text-xs text-slate-500">
          Batch #{batchId} • Layer 2 Registry Check
        </p>
      </main>
    );
  }

  const isGenuineFirstScan = verification?.status === "GENUINE_CLAIMED_NOW";
  const isDuplicateWarning = verification?.status === "DUPLICATE_SCAN_WARNING";

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#3f3f46] bg-[#09090b]/40 backdrop-blur-2xl px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-stone-400 transition"
        >
          <ArrowLeftIcon size={14} />
          Producer Studio
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3f3f46] bg-[#09090b]/40 backdrop-blur-2xl px-3 py-1 font-mono text-[11px] font-bold text-slate-300">
          <FileTextIcon size={13} className="text-cyan-400" />
          Passport #{batchId}
        </span>
      </div>

      {/* 1. First Scan Genuine Seal */}
      {isGenuineFirstScan && (
        <section className="rounded-3xl border-2 border-[#1B4332] bg-cyan-950/50 p-6 text-center shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 shadow-sm">
            <ShieldCheckIcon size={32} />
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10/10 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-cyan-400">
            <AwardIcon size={13} />
            100% Genuine • First Scan Claimed
          </span>
          <h1 className="mt-2 text-2xl font-black text-white">
            Authentic Maker&apos;s Seal
          </h1>
          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
            Cryptographic PIN{" "}
            <code className="inline-flex items-center gap-1 font-mono font-bold text-cyan-400">
              <LockIcon size={11} />
              {secret}
            </code>{" "}
            matched the producer&apos;s Layer 2 signature and has now been claimed
            exclusively by your scan.
          </p>

          <button
            type="button"
            onClick={executeClaimCheck}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#1B4332]/30 bg-[#09090b]/40 backdrop-blur-2xl px-4 py-2 text-xs font-bold text-cyan-400 hover:bg-[#09090b] transition shadow-sm"
          >
            <RefreshCwIcon size={13} />
            Simulate 2nd Scan (Test Counterfeit Duplicate Alert)
          </button>
        </section>
      )}

      {/* 2. Duplicate Scan / Counterfeit Warning */}
      {isDuplicateWarning && (
        <section className="rounded-3xl border-2 border-amber-700 bg-amber-50/90 p-6 text-center shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-700 text-white">
            <ShieldAlertIcon size={32} />
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-900/10 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-900">
            <ShieldAlertIcon size={13} />
            Security Warning • Code Previously Claimed
          </span>
          <h1 className="mt-2 text-2xl font-black text-white">
            Duplicate Scan Detected
          </h1>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            This unit&apos;s QR code was already claimed on{" "}
            <strong className="underline text-amber-950">
              {verification?.claimedAtISO
                ? new Date(verification.claimedAtISO).toLocaleString()
                : "an earlier scan"}
            </strong>
            . If you just purchased this item sealed, it may carry a cloned label.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-300 bg-[#09090b]/40 backdrop-blur-2xl p-4 text-left">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <FlagIcon size={13} className="text-amber-800" />
              Flag Suspected Counterfeit Retail Location
            </p>
            {reportSent ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <ShieldCheckIcon size={14} />
                Tamper alert recorded on-chain for the producer.
              </p>
            ) : (
              <form onSubmit={handleReportTamper} className="mt-2 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Shop name or city where purchased..."
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-300 bg-[#09090b] px-3 py-1.5 text-xs text-white focus:border-amber-700 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-800 transition"
                >
                  <FlagIcon size={12} />
                  Report
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* 3. Invalid Secret */}
      {!isGenuineFirstScan && !isDuplicateWarning && (
        <section className="rounded-3xl border-2 border-red-700 bg-red-50 p-6 text-center shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-700 text-white">
            <ShieldXIcon size={32} />
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-900/10 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-red-900">
            Verification Failed
          </span>
          <h1 className="mt-2 text-2xl font-black text-white">
            Unrecognized QR Signature
          </h1>
          <p className="mt-2 text-xs text-red-900">
            {verification?.message ||
              "This QR code does not match any authentic batch secret on the registry."}
          </p>
        </section>
      )}

      {/* Artisanal Digital Product Passport Card */}
      {verification?.metadata && verification.batch && (
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#09090b]/40 backdrop-blur-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-white/10 pb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-cyan-400">
              <Building2Icon size={13} />
              {verification.metadata.producerName}
            </span>
            <h2 className="text-xl font-black text-white mt-0.5">
              {verification.metadata.productName}
            </h2>
            {verification.metadata.storyNote && (
              <p className="mt-2 text-xs italic text-slate-400 leading-relaxed">
                &ldquo;{verification.metadata.storyNote}&rdquo;
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-white/10 bg-[#09090b] p-3">
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <MapPinIcon size={12} className="text-cyan-400" />
                Origin Terroir
              </span>
              <strong className="text-white mt-1 block">
                {verification.metadata.originRegion}
              </strong>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#09090b] p-3">
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <CalendarIcon size={12} className="text-cyan-400" />
                Harvest / Batch Date
              </span>
              <strong className="text-white mt-1 block">
                {verification.metadata.harvestOrProductionDate}
              </strong>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#09090b] p-3">
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <TagIcon size={12} className="text-cyan-400" />
                Batch Lot Code
              </span>
              <strong className="font-mono text-white mt-1 block">
                {verification.metadata.batchCode}
              </strong>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#09090b] p-3">
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <ShieldCheckIcon size={12} className="text-cyan-400" />
                Units Verified
              </span>
              <strong className="font-mono text-cyan-400 mt-1 block">
                {verification.claimedUnits} of {verification.totalUnits} units
              </strong>
            </div>
          </div>

          {verification.metadata.attributes.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                <FlaskConicalIcon size={13} className="text-cyan-400" />
                Independent Lab &amp; Quality Certificates
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {verification.metadata.attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#09090b] px-3.5 py-2.5 text-xs"
                  >
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-400">
                      <AwardIcon size={13} className="text-cyan-400" />
                      {attr.trait_type}
                    </span>
                    <span className="font-bold text-cyan-400">
                      {attr.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#09090b] p-3.5 font-mono text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <LockIcon size={12} className="text-cyan-400" />
                Producer Signer:
              </span>
              <span className="font-bold text-slate-200">
                {verification.batch.producer.slice(0, 10)}…
                {verification.batch.producer.slice(-6)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <DatabaseIcon size={12} className="text-cyan-400" />
                IPFS Metadata CID:
              </span>
              <span className="font-bold text-cyan-400">
                {verification.batch.ipfsCID.slice(0, 18)}…
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <Link2Icon size={12} className="text-cyan-400" />
                Keccak256 Secret Hash:
              </span>
              <span className="text-slate-200">
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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1B4332] border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-slate-200">
            Loading Product Passport…
          </p>
        </main>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
