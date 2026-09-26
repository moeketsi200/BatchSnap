"use client";

import React, { useEffect, useState } from "react";
import { PrintableLabelSheet } from "@/components/PrintableLabelSheet";
import type {
  BatchMetadata,
  CreateBatchResponse,
  LabelTemplateType,
  OnChainBatch,
  ProductCategory,
} from "@/lib/types";

interface BatchSummaryItem {
  batch: OnChainBatch;
  totalUnits: number;
  claimedUnits: number;
  tamperReportCount: number;
  metadata: BatchMetadata | null;
}

const PRESETS: Array<{
  label: string;
  productName: string;
  category: ProductCategory;
  producerName: string;
  originRegion: string;
  unitCount: number;
  coaValue: string;
  purityValue: string;
  storyNote: string;
}> = [
  {
    label: "🍯 Raw Fynbos Honey",
    productName: "Cederberg Raw Fynbos Honey",
    category: "honey",
    producerName: "Cederberg Apiaries Co-op",
    originRegion: "Western Cape, South Africa",
    unitCount: 12,
    coaValue: "Lab CoA #ZA-8841 (MGO 400+)",
    purityValue: "100% Unheated Wildflower",
    storyNote: "Single-origin mountain harvest from wild protea & erica blossoms.",
  },
  {
    label: "☕ Specialty Roast Coffee",
    productName: "Yirgacheffe Heirloom Micro-Lot",
    category: "coffee",
    producerName: "Highland Roasters Collective",
    originRegion: "Gedeo Zone, Ethiopia",
    unitCount: 15,
    coaValue: "Cupping Score 89.5 (SCA Certified)",
    purityValue: "Washed Process • 2,100m",
    storyNote: "Smallholder shade-grown Arabica, sun-dried on raised African beds.",
  },
  {
    label: "🫒 Estate Olive Oil",
    productName: "Cold-Pressed Mission Extra Virgin",
    category: "olive-oil",
    producerName: "Kloof Olive Estate",
    originRegion: "Franschhoek Valley, ZA",
    unitCount: 10,
    coaValue: "Free Acidity 0.18% • Peroxide < 6",
    purityValue: "First Cold Extraction",
    storyNote: "Pressed within 4 hours of hand-picking; nitrogen-sealed bottling.",
  },
  {
    label: "🌿 Botanical Skincare",
    productName: "Cold-Pressed Marula Facial Elixir",
    category: "cosmetics",
    producerName: "Limpopo Botanicals Lab",
    originRegion: "Hoedspruit, South Africa",
    unitCount: 12,
    coaValue: "GC-MS Purity 99.4% • Zero Heavy Metals",
    purityValue: "Wild-Harvested Kernel Oil",
    storyNote: "Fair-trade women's cooperative cold-press extraction.",
  },
];

export default function ProducerDashboardPage() {
  const [productName, setProductName] = useState(PRESETS[0].productName);
  const [category, setCategory] = useState<ProductCategory>(PRESETS[0].category);
  const [producerName, setProducerName] = useState(PRESETS[0].producerName);
  const [originRegion, setOriginRegion] = useState(PRESETS[0].originRegion);
  const [harvestDate, setHarvestDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [unitCount, setUnitCount] = useState<number>(PRESETS[0].unitCount);
  const [labelTemplate, setLabelTemplate] =
    useState<LabelTemplateType>("avery-5160");
  const [coaValue, setCoaValue] = useState(PRESETS[0].coaValue);
  const [purityValue, setPurityValue] = useState(PRESETS[0].purityValue);
  const [storyNote, setStoryNote] = useState(PRESETS[0].storyNote);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBatch, setCreatedBatch] = useState<CreateBatchResponse | null>(
    null
  );
  const [recentBatches, setRecentBatches] = useState<BatchSummaryItem[]>([]);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/batches");
      if (!res.ok) return;
      const data = (await res.json()) as { batches: BatchSummaryItem[] };
      setRecentBatches(data.batches || []);
    } catch {
      // Ignore background poll errors
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setProductName(preset.productName);
    setCategory(preset.category);
    setProducerName(preset.producerName);
    setOriginRegion(preset.originRegion);
    setUnitCount(preset.unitCount);
    setCoaValue(preset.coaValue);
    setPurityValue(preset.purityValue);
    setStoryNote(preset.storyNote);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          category,
          producerName,
          originRegion,
          harvestOrProductionDate: harvestDate,
          unitCount,
          labelTemplate,
          storyNote,
          attributes: [
            { trait_type: "Lab Certificate (CoA)", value: coaValue },
            { trait_type: "Quality / Spec", value: purityValue },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to anchor batch");
      }

      setCreatedBatch(data as CreateBatchResponse);
      await fetchBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Artisanal Studio Header (hidden when printing) */}
      <header className="no-print mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#E2D9C5] pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B4332] text-2xl text-[#FAF6F0] shadow-sm">
            📦
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-stone-900">
                BatchSnap Studio
              </h1>
              <span className="rounded-full bg-[#E9F5EE] px-3 py-0.5 text-[11px] font-bold text-[#1B4332] border border-[#B7C9BD]">
                Artisanal Provenance &amp; QR Seal
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Anchor small-batch harvests to Layer 2 &amp; print tamper-evident cryptographic labels in under 60 seconds
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="rounded-xl border border-[#E2D9C5] bg-[#FFFDF9] px-3.5 py-2 shadow-sm">
            <span className="text-stone-500">Network:</span>{" "}
            <strong className="text-stone-800">Base L2 (84532)</strong>
          </div>
          <div className="rounded-xl border border-[#E2D9C5] bg-[#FFFDF9] px-3.5 py-2 shadow-sm">
            <span className="text-stone-500">Pinning:</span>{" "}
            <strong className="text-[#1B4332]">IPFS Immutable CID</strong>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Producer Batch Form & Registry */}
        <section className="no-print lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-[#E2D9C5] bg-[#FFFDF9] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-[#EFE8D8] pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2D6A4F]">
                  Step 1 • Producer Origin Record
                </span>
                <h2 className="text-lg font-black text-stone-900">
                  Create &amp; Anchor Batch
                </h2>
              </div>
              <span className="rounded-xl bg-[#FAF6F0] border border-[#E2D9C5] px-2.5 py-1 font-mono text-[11px] font-bold text-stone-700">
                ⚡ 60s Flow
              </span>
            </div>

            {/* Quick Producer Presets */}
            <div className="mb-5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                Load Craft Producer Preset
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => {
                  const active = productName === preset.productName;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-[#1B4332] bg-[#1B4332] text-[#FAF6F0] shadow-sm"
                          : "border-[#D8CEB8] bg-[#FAF6F0] text-stone-700 hover:border-stone-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Batch / Product Name
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3.5 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Craft Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as ProductCategory)
                    }
                    className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  >
                    <option value="honey">🍯 Honey &amp; Apiary</option>
                    <option value="coffee">☕ Specialty Coffee</option>
                    <option value="olive-oil">🫒 Estate Olive Oil</option>
                    <option value="cosmetics">🌿 Botanical Skincare</option>
                    <option value="wine-spirits">🍷 Wine &amp; Craft Spirits</option>
                    <option value="other">📦 Other Artisan Good</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Harvest / Roast Date
                  </label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Producer / Estate
                  </label>
                  <input
                    type="text"
                    required
                    value={producerName}
                    onChange={(e) => setProducerName(e.target.value)}
                    className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3.5 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Origin Terroir / Region
                  </label>
                  <input
                    type="text"
                    required
                    value={originRegion}
                    onChange={(e) => setOriginRegion(e.target.value)}
                    className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3.5 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Lab Certificate (CoA)
                  </label>
                  <input
                    type="text"
                    value={coaValue}
                    onChange={(e) => setCoaValue(e.target.value)}
                    className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3.5 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Purity / Grade Spec
                  </label>
                  <input
                    type="text"
                    value={purityValue}
                    onChange={(e) => setPurityValue(e.target.value)}
                    className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3.5 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Maker&apos;s Provenance Note
                </label>
                <textarea
                  rows={2}
                  value={storyNote}
                  onChange={(e) => setStoryNote(e.target.value)}
                  className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3.5 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Serialized QR Stickers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={unitCount}
                    onChange={(e) => setUnitCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3.5 py-2 text-sm font-bold text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Default Sheet Layout
                  </label>
                  <select
                    value={labelTemplate}
                    onChange={(e) =>
                      setLabelTemplate(e.target.value as LabelTemplateType)
                    }
                    className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3 py-2 text-sm font-medium text-stone-900 focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  >
                    <option value="avery-5160">Avery 5160 (30-up)</option>
                    <option value="avery-5163">Avery 5163 (10-up)</option>
                    <option value="thermal-roll">2&quot;×2&quot; Thermal Roll</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#1B4332] py-3.5 text-sm font-bold text-[#FAF6F0] shadow-md hover:bg-[#2D6A4F] disabled:opacity-50 transition"
              >
                {isSubmitting
                  ? "Pinning to IPFS & Anchoring Batch..."
                  : `⚡ Anchor Batch & Generate ${unitCount} Scannable Stickers`}
              </button>
            </form>
          </div>

          {/* Anchored Batches Ledger */}
          <div className="rounded-3xl border border-[#E2D9C5] bg-[#FFFDF9] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-stone-900">
                  Anchored Provenance Ledger
                </h3>
                <p className="text-[11px] text-stone-500">
                  Live single-claim scan telemetry from your printed batches
                </p>
              </div>
              <button
                type="button"
                onClick={fetchBatches}
                className="rounded-lg border border-[#D8CEB8] bg-[#FAF6F0] px-2.5 py-1 text-xs font-bold text-[#1B4332] hover:bg-stone-100"
              >
                Refresh
              </button>
            </div>

            {recentBatches.length === 0 ? (
              <p className="text-xs text-stone-500 py-2">
                No batches anchored yet. Mint your first batch above to generate
                scannable QR stickers.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentBatches.map((item) => (
                  <div
                    key={item.batch.batchId}
                    className="flex items-center justify-between rounded-2xl border border-[#E6DEC8] bg-[#FAF6F0] p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#1B4332] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                          #{item.batch.batchId}
                        </span>
                        <span className="truncate font-bold text-stone-900">
                          {item.metadata?.productName || "Batch Record"}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-stone-500 truncate mt-1">
                        IPFS: {item.batch.ipfsCID.slice(0, 24)}…
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block rounded-lg border border-[#D8CEB8] bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-stone-800">
                        {item.claimedUnits}/{item.totalUnits} Claimed
                      </span>
                      {item.tamperReportCount > 0 && (
                        <p className="mt-1 text-[10px] font-bold text-amber-800">
                          ⚠️ {item.tamperReportCount} Tamper Alert(s)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Interactive Sticker Customizer & Print Sheet */}
        <section className="lg:col-span-7">
          {createdBatch ? (
            <PrintableLabelSheet
              batchData={createdBatch}
              initialTemplate={labelTemplate}
            />
          ) : (
            <div className="no-print flex h-full min-h-[460px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#D8CEB8] bg-[#FFFDF9]/70 p-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E9F5EE] border border-[#B7C9BD] text-3xl">
                🏷️
              </div>
              <span className="rounded-full bg-[#FAF6F0] border border-[#E2D9C5] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Step 2 • Sticker Customizer &amp; Print Studio
              </span>
              <h2 className="mt-2 text-xl font-black text-stone-900">
                Your Customizable QR Label Sheet Will Appear Here
              </h2>
              <p className="mt-2 max-w-md text-xs text-stone-600 leading-relaxed">
                Fill in your harvest details on the left and click{" "}
                <strong className="text-[#1B4332]">
                  Anchor Batch &amp; Generate Scannable Stickers
                </strong>
                . You&apos;ll be able to customize ink colors, apothecary borders,
                center QR emblems, and print directly to Avery or thermal sheets.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
