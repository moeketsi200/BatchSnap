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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="no-print mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-2xl">
            📦
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                BatchSnap
              </h1>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                Layer 2 Provenance
              </span>
            </div>
            <p className="text-xs text-slate-400">
              No-code batch provenance &amp; single-claim anti-counterfeit label
              generator for small producers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
            <span className="text-slate-500">Chain:</span>{" "}
            <strong className="text-slate-200">Base Sepolia (84532)</strong>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
            <span className="text-slate-500">Storage:</span>{" "}
            <strong className="text-emerald-400">IPFS Content-Addressed</strong>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="no-print lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  1. Snap &amp; Mint Batch
                </h2>
                <p className="text-xs text-slate-400">
                  Pin batch metadata to IPFS and generate serialized QR labels.
                </p>
              </div>
              <span className="rounded-lg bg-slate-800 px-2.5 py-1 font-mono text-[11px] text-slate-300">
                ⚡ &lt; 60 sec
              </span>
            </div>

            <div className="mb-5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Quick-Fill Producer Templates
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-lg border border-slate-700/80 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as ProductCategory)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="honey">🍯 Honey &amp; Apiary</option>
                    <option value="coffee">☕ Specialty Coffee</option>
                    <option value="olive-oil">🫒 Olive Oil</option>
                    <option value="cosmetics">🌿 Cosmetics / Skincare</option>
                    <option value="wine-spirits">🍷 Wine &amp; Craft Spirits</option>
                    <option value="other">📦 Other Artisan Good</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Harvest / Batch Date
                  </label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Producer / Estate Name
                  </label>
                  <input
                    type="text"
                    required
                    value={producerName}
                    onChange={(e) => setProducerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Origin Region
                  </label>
                  <input
                    type="text"
                    required
                    value={originRegion}
                    onChange={(e) => setOriginRegion(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Lab Certificate (CoA)
                  </label>
                  <input
                    type="text"
                    value={coaValue}
                    onChange={(e) => setCoaValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Purity / Spec Badge
                  </label>
                  <input
                    type="text"
                    value={purityValue}
                    onChange={(e) => setPurityValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Producer Provenance Note
                </label>
                <textarea
                  rows={2}
                  value={storyNote}
                  onChange={(e) => setStoryNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Serialized QR Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={unitCount}
                    onChange={(e) => setUnitCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Label Sheet Format
                  </label>
                  <select
                    value={labelTemplate}
                    onChange={(e) =>
                      setLabelTemplate(e.target.value as LabelTemplateType)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="avery-5160">Avery 5160 (30-up)</option>
                    <option value="avery-5163">Avery 5163 (10-up)</option>
                    <option value="thermal-roll">2&quot;×2&quot; Thermal Roll</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition"
              >
                {isSubmitting
                  ? "Pinning to IPFS & Anchoring Batch..."
                  : `⚡ Anchor Batch & Generate ${unitCount} QR Labels`}
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">
                On-Chain Registry Telemetry
              </h3>
              <button
                type="button"
                onClick={fetchBatches}
                className="text-xs text-emerald-400 hover:underline"
              >
                Refresh
              </button>
            </div>

            {recentBatches.length === 0 ? (
              <p className="text-xs text-slate-400">
                No batches anchored yet. Mint your first batch above to generate
                tamper-evident QR labels.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentBatches.map((item) => (
                  <div
                    key={item.batch.batchId}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">
                          #{item.batch.batchId}
                        </span>
                        <span className="truncate font-semibold text-slate-200">
                          {item.metadata?.productName || "Batch Record"}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                        CID: {item.batch.ipfsCID.slice(0, 22)}…
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                        {item.claimedUnits}/{item.totalUnits} Scanned
                      </span>
                      {item.tamperReportCount > 0 && (
                        <p className="mt-1 text-[10px] font-semibold text-amber-400">
                          ⚠️ {item.tamperReportCount} Tamper Report(s)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-7">
          {createdBatch ? (
            <PrintableLabelSheet
              batchData={createdBatch}
              initialTemplate={labelTemplate}
            />
          ) : (
            <div className="no-print flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-2xl">
                🖨️
              </div>
              <h2 className="text-lg font-bold text-white">
                Print-Ready Cryptographic Label Sheet
              </h2>
              <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
                Complete the 60-second batch form on the left and tap{" "}
                <strong className="text-emerald-400">
                  Anchor Batch &amp; Generate QR Labels
                </strong>
                . Your serialized Avery / thermal stickers with single-claim
                anti-counterfeit URLs will appear here ready to print or test.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
