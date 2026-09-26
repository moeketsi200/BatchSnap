"use client";

import React, { useState } from "react";
import Link from "next/link";
import type {
  CreateBatchResponse,
  LabelTemplateType,
} from "@/lib/types";
import { QrMatrixSvg } from "./QrMatrixSvg";

interface PrintableLabelSheetProps {
  batchData: CreateBatchResponse;
  initialTemplate?: LabelTemplateType;
}

export function PrintableLabelSheet({
  batchData,
  initialTemplate = "avery-5160",
}: PrintableLabelSheetProps) {
  const [template, setTemplate] = useState<LabelTemplateType>(initialTemplate);

  const gridClass =
    template === "avery-5160"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : template === "avery-5163"
      ? "grid-cols-1 md:grid-cols-2 gap-4"
      : "grid-cols-1 max-w-sm mx-auto gap-4";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-5">
      {/* Control Toolbar (hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              Batch #{batchData.batchId} Anchored
            </span>
            <span className="text-xs font-mono text-slate-400">
              {batchData.labels.length} Serialized Units
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Each sticker encodes a unique single-claim cryptographic secret (
            <code className="text-emerald-300 font-mono text-xs">
              /v/{batchData.batchId}?secret=...
            </code>
            ).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as LabelTemplateType)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="avery-5160">Avery 5160 (30-up Sheet)</option>
            <option value="avery-5163">Avery 5163 (10-up Large Jar)</option>
            <option value="thermal-roll">2&quot; × 2&quot; Thermal Roll</option>
          </select>

          {batchData.labels[0] && (
            <Link
              href={`/v/${batchData.batchId}?secret=${batchData.labels[0].secret}`}
              target="_blank"
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              🔍 Simulate Scan (Unit #1)
            </Link>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
          >
            🖨️ Print / Export PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="print-sheet rounded-2xl border border-slate-800 bg-white p-6 text-slate-900 shadow-2xl">
        <div className="no-print mb-4 flex items-center justify-between border-b border-slate-200 pb-3 text-xs text-slate-500">
          <span>
            Template:{" "}
            <strong className="text-slate-800 uppercase">{template}</strong> •{" "}
            {batchData.metadata.productName} ({batchData.metadata.batchCode})
          </span>
          <span className="font-mono">
            IPFS CID: {batchData.ipfsCID.slice(0, 18)}…
          </span>
        </div>

        <div className={`grid ${gridClass}`}>
          {batchData.labels.map((unit) => (
            <div
              key={unit.unitNumber}
              className="print-label-card flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 transition hover:border-emerald-600"
            >
              <div className="shrink-0 rounded-lg border border-slate-200 p-1 bg-white">
                <QrMatrixSvg
                  value={unit.verifyUrl}
                  size={template === "avery-5163" ? 84 : 68}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-bold uppercase tracking-wider text-emerald-800">
                    {batchData.metadata.producerName}
                  </span>
                  <span className="shrink-0 rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    #{batchData.batchId}-{String(unit.unitNumber).padStart(3, "0")}
                  </span>
                </div>

                <p className="truncate text-sm font-extrabold text-slate-900 mt-0.5">
                  {batchData.metadata.productName}
                </p>

                <p className="text-[11px] text-slate-600 truncate">
                  Origin: {batchData.metadata.originRegion} •{" "}
                  {batchData.metadata.harvestOrProductionDate}
                </p>

                <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-1">
                  <span className="font-mono text-[10px] text-slate-500">
                    PIN: <strong className="text-slate-900">{unit.secret}</strong>
                  </span>
                  <Link
                    href={`/v/${batchData.batchId}?secret=${unit.secret}`}
                    target="_blank"
                    className="no-print text-[10px] font-semibold text-emerald-700 hover:underline"
                  >
                    Test Scan →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
