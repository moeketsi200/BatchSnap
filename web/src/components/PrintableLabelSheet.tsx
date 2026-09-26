"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type {
  CreateBatchResponse,
  LabelTemplateType,
  ProductCategory,
} from "@/lib/types";
import {
  ArrowUpRightIcon,
  AwardIcon,
  CalendarIcon,
  DatabaseIcon,
  EmblemIcon,
  type EmblemIconName,
  LayoutGridIcon,
  LockIcon,
  MapPinIcon,
  PaletteIcon,
  PrinterIcon,
  QrCodeIcon,
  ScanLineIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  TagIcon,
} from "./LucideIcons";
import { QrMatrixSvg } from "./QrMatrixSvg";

interface PrintableLabelSheetProps {
  batchData: CreateBatchResponse;
  initialTemplate?: LabelTemplateType;
}

type StickerColorTheme = "forest" | "espresso" | "terracotta" | "monochrome";
type StickerBorderStyle = "dashed" | "double" | "solid" | "stamp";

const COLOR_THEMES: Record<
  StickerColorTheme,
  {
    name: string;
    swatch: string;
    qrFg: string;
    qrBg: string;
    badgeBg: string;
    badgeText: string;
    producerColor: string;
    borderColor: string;
    accentPillBg: string;
    accentPillText: string;
  }
> = {
  forest: { // Cyberpunk Neon
    name: "Cyber Neon",
    swatch: "#06b6d4",
    qrFg: "#083344", // dark cyan for QR on white so it scans well
    qrBg: "#ffffff",
    badgeBg: "#06b6d4",
    badgeText: "#000000",
    producerColor: "#0891b2",
    borderColor: "#164e63",
    accentPillBg: "#cffafe",
    accentPillText: "#164e63",
  },
  espresso: { // Dark Matter
    name: "Dark Matter",
    swatch: "#6366f1",
    qrFg: "#1e1b4b",
    qrBg: "#ffffff",
    badgeBg: "#6366f1",
    badgeText: "#ffffff",
    producerColor: "#4f46e5",
    borderColor: "#3730a3",
    accentPillBg: "#e0e7ff",
    accentPillText: "#312e81",
  },
  terracotta: { // Matrix Green
    name: "Matrix Code",
    swatch: "#22c55e",
    qrFg: "#052e16",
    qrBg: "#ffffff",
    badgeBg: "#22c55e",
    badgeText: "#000000",
    producerColor: "#16a34a",
    borderColor: "#14532d",
    accentPillBg: "#dcfce7",
    accentPillText: "#14532d",
  },
  monochrome: { // Minimal Web3
    name: "ZK Monochrome",
    swatch: "#09090b",
    qrFg: "#000000",
    qrBg: "#ffffff",
    badgeBg: "#000000",
    badgeText: "#ffffff",
    producerColor: "#3f3f46",
    borderColor: "#d4d4d8",
    accentPillBg: "#f4f4f5",
    accentPillText: "#18181b",
  },
};

const CATEGORY_DEFAULT_ICON: Record<ProductCategory, EmblemIconName> = {
  honey: "droplets",
  coffee: "coffee",
  "olive-oil": "leaf",
  cosmetics: "flask",
  "wine-spirits": "wine",
  other: "shield-check",
};

const LUCIDE_EMBLEM_OPTIONS: Array<{ name: EmblemIconName; label: string }> = [
  { name: "shield-check", label: "Shield Seal" },
  { name: "leaf", label: "Botanical Leaf" },
  { name: "coffee", label: "Roast Cup" },
  { name: "droplets", label: "Pure Drop" },
  { name: "flask", label: "Lab Flask" },
  { name: "wine", label: "Estate Reserve" },
  { name: "award", label: "Quality Ribbon" },
  { name: "sparkles", label: "Artisan Craft" },
  { name: "crown", label: "Heritage Crown" },
  { name: "mountain", label: "Highland Origin" },
  { name: "flower", label: "Wild Blossom" },
  { name: "package", label: "Batch Parcel" },
];

export function PrintableLabelSheet({
  batchData,
  initialTemplate = "avery-5160",
}: PrintableLabelSheetProps) {
  const [template, setTemplate] = useState<LabelTemplateType>(initialTemplate);
  const [colorTheme, setColorTheme] = useState<StickerColorTheme>("forest");
  const [borderStyle, setBorderStyle] = useState<StickerBorderStyle>("dashed");
  const [showCenterBadge, setShowCenterBadge] = useState<boolean>(true);
  const [showScratchPin, setShowScratchPin] = useState<boolean>(true);
  const [selectedIcon, setSelectedIcon] = useState<EmblemIconName>(
    CATEGORY_DEFAULT_ICON[batchData.metadata.category] || "shield-check"
  );
  const [customSealText, setCustomSealText] = useState<string>(
    "VERIFIED ORIGIN"
  );

  useEffect(() => {
    setSelectedIcon(
      CATEGORY_DEFAULT_ICON[batchData.metadata.category] || "shield-check"
    );
  }, [batchData.metadata.category]);

  const theme = COLOR_THEMES[colorTheme];

  const gridClass =
    template === "avery-5160"
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5"
      : template === "avery-5163"
      ? "grid-cols-1 md:grid-cols-2 gap-4"
      : "grid-cols-1 max-w-sm mx-auto gap-4";

  const borderCss =
    borderStyle === "dashed"
      ? "border-2 border-dashed rounded-xl"
      : borderStyle === "double"
      ? "border-4 border-double rounded-xl"
      : borderStyle === "stamp"
      ? "border-2 border-solid rounded-2xl shadow-sm"
      : "border border-solid rounded-lg";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-5">
      {/* Sticker Customization Studio Toolbar (hidden when printing) */}
      <div className="no-print rounded-3xl border border-[#27272a] bg-[#18181b] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#27272a] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-900/20 px-3 py-1 text-xs font-bold text-cyan-400 border border-cyan-800/30">
                <ShieldCheckIcon size={14} className="text-cyan-400" />
                Batch #{batchData.batchId} Anchored
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500">
                <TagIcon size={13} />
                {batchData.labels.length} Serialized Stickers
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Real camera-scannable ISO QR codes with Lucide vector outline emblems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {batchData.labels[0] && (
              <Link
                href={`/v/${batchData.batchId}?secret=${batchData.labels[0].secret}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2 text-xs font-bold text-cyan-400 hover:bg-emerald-100 transition"
              >
                <ScanLineIcon size={14} />
                Test Scan Unit #1
              </Link>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)] px-4 py-2 text-xs font-bold text-[#09090b] shadow-sm hover:bg-[#2D6A4F] transition"
            >
              <PrinterIcon size={14} />
              Print / Save PDF Sheet
            </button>
          </div>
        </div>

        {/* Lucide Vector Emblem Picker Bar */}
        <div className="rounded-2xl border border-[#27272a] bg-[#09090b] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <QrCodeIcon size={14} className="text-cyan-400" />
              Select Lucide Vector QR Center Emblem
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              Active Icon:
              <EmblemIcon name={selectedIcon} size={15} className="text-cyan-400" />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {LUCIDE_EMBLEM_OPTIONS.map((item) => {
              const active = selectedIcon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    setSelectedIcon(item.name);
                    setShowCenterBadge(true);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                    active ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "border-[#3f3f46] bg-[#09090b] text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <EmblemIcon name={item.name} size={15} />
                  <span className="hidden sm:inline text-[11px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customization Controls Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {/* 1. Sheet Template */}
          <div>
            <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1.5">
              <LayoutGridIcon size={12} />
              Label Sheet Format
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as LabelTemplateType)}
              className="w-full rounded-xl border border-[#3f3f46] bg-[#09090b] px-3 py-2 text-xs font-semibold text-slate-200 focus:border-[#1B4332] focus:outline-none"
            >
              <option value="avery-5160">Avery 5160 (30-up Sheet)</option>
              <option value="avery-5163">Avery 5163 (10-up Large Jar)</option>
              <option value="thermal-roll">2&quot; × 2&quot; Thermal Roll</option>
            </select>
          </div>

          {/* 2. Color Palette */}
          <div>
            <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1.5">
              <PaletteIcon size={12} />
              Ink &amp; Seal Palette
            </label>
            <div className="flex items-center gap-1.5">
              {(Object.keys(COLOR_THEMES) as StickerColorTheme[]).map((key) => {
                const item = COLOR_THEMES[key];
                const active = colorTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColorTheme(key)}
                    title={item.name}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 font-semibold transition ${
                      active ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "border-[#3f3f46] bg-[#09090b] text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-white/40"
                      style={{ backgroundColor: item.swatch }}
                    />
                    <span className="hidden xl:inline">
                      {item.name.split(" ")[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Border Cut Style */}
          <div>
            <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1.5">
              <ScissorsIcon size={12} />
              Border / Frame Style
            </label>
            <select
              value={borderStyle}
              onChange={(e) =>
                setBorderStyle(e.target.value as StickerBorderStyle)
              }
              className="w-full rounded-xl border border-[#3f3f46] bg-[#09090b] px-3 py-2 text-xs font-semibold text-slate-200 focus:border-[#1B4332] focus:outline-none"
            >
              <option value="dashed">Perforated Craft Cut (Dashed)</option>
              <option value="double">Apothecary Double Frame</option>
              <option value="stamp">Estate Wax Stamp (Rounded)</option>
              <option value="solid">Minimal Hairline (Solid)</option>
            </select>
          </div>

          {/* 4. Seal & Badge Toggles */}
          <div>
            <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1.5">
              <ShieldCheckIcon size={12} />
              QR Emblem &amp; PIN Strip
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCenterBadge((v) => !v)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 font-semibold transition ${
                  showCenterBadge
                    ? "border-emerald-800 bg-cyan-900/20 text-emerald-950"
                    : "border-[#3f3f46] bg-[#09090b] text-slate-500"
                }`}
              >
                <EmblemIcon name={selectedIcon} size={13} />
                {showCenterBadge ? "Emblem On" : "Emblem Off"}
              </button>
              <button
                type="button"
                onClick={() => setShowScratchPin((v) => !v)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 font-semibold transition ${
                  showScratchPin
                    ? "border-amber-800 bg-amber-900/10 text-amber-950"
                    : "border-[#3f3f46] bg-[#09090b] text-slate-500"
                }`}
              >
                <LockIcon size={13} />
                {showScratchPin ? "PIN On" : "PIN Off"}
              </button>
            </div>
          </div>
        </div>

        {/* Custom Seal Banner Text */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-400">
              <AwardIcon size={14} className="text-cyan-400" />
              Seal Ribbon Text:
            </span>
            <input
              type="text"
              maxLength={24}
              value={customSealText}
              onChange={(e) => setCustomSealText(e.target.value)}
              className="rounded-lg border border-[#3f3f46] bg-[#09090b] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-200 focus:border-[#1B4332] focus:outline-none"
            />
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <DatabaseIcon size={13} />
            IPFS CID: {batchData.ipfsCID.slice(0, 22)}…
          </span>
        </div>
      </div>

      {/* Printable Label Sheet Surface */}
      <div className="print-sheet rounded-3xl border border-[#27272a] bg-[#09090b] p-6 text-white shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <PrinterIcon size={14} className="text-slate-300" />
            Print Sheet Preview:{" "}
            <strong className="text-slate-200 uppercase">{template}</strong> •{" "}
            {batchData.metadata.productName} ({batchData.metadata.batchCode})
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
            <ScanLineIcon size={14} />
            Point your phone camera at any QR code below to verify
          </span>
        </div>

        <div className={`grid ${gridClass}`}>
          {batchData.labels.map((unit) => (
            <div
              key={unit.unitNumber}
              style={{ borderColor: theme.borderColor }}
              className={`print-label-card relative flex items-center gap-3 bg-white p-3.5 transition hover:shadow-md ${borderCss}`}
            >
              {/* Scannable Vector QR Code with Lucide Outline Emblem */}
              <div className="shrink-0 rounded-xl border p-1.5 bg-white shadow-sm"
                style={{ borderColor: theme.borderColor }}
              >
                <QrMatrixSvg
                  value={unit.verifyUrl}
                  size={template === "avery-5163" ? 96 : 78}
                  fgColor={theme.qrFg}
                  bgColor={theme.qrBg}
                  emblemIcon={selectedIcon}
                  showBadge={showCenterBadge}
                />
              </div>

              {/* Artisanal Label Typography */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="inline-flex items-center gap-1 truncate text-[10px] font-extrabold uppercase tracking-widest"
                    style={{ color: theme.producerColor }}
                  >
                    <EmblemIcon name={selectedIcon} size={12} />
                    <span className="truncate">{batchData.metadata.producerName}</span>
                  </span>
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold"
                    style={{
                      backgroundColor: theme.badgeBg,
                      color: theme.badgeText,
                    }}
                  >
                    #{batchData.batchId}-
                    {String(unit.unitNumber).padStart(3, "0")}
                  </span>
                </div>

                <p className="truncate text-sm font-black text-black mt-0.5">
                  {batchData.metadata.productName}
                </p>

                <p className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-slate-700 truncate">
                  <span className="inline-flex items-center gap-0.5 truncate">
                    <MapPinIcon size={11} />
                    {batchData.metadata.originRegion}
                  </span>
                  <span className="inline-flex items-center gap-0.5 shrink-0">
                    <CalendarIcon size={11} />
                    {batchData.metadata.harvestOrProductionDate}
                  </span>
                </p>

                <div className="mt-1.5 flex items-center justify-between gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                    style={{
                      backgroundColor: theme.accentPillBg,
                      color: theme.accentPillText,
                    }}
                  >
                    <ShieldCheckIcon size={10} />
                    {customSealText || "VERIFIED ORIGIN"}
                  </span>

                  {showScratchPin && (
                    <span className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-800">
                      <LockIcon size={10} />
                      <strong className="text-black">{unit.secret}</strong>
                    </span>
                  )}
                </div>

                <div className="no-print mt-1.5 flex items-center justify-end border-t border-stone-200/70 pt-1">
                  <Link
                    href={`/v/${batchData.batchId}?secret=${unit.secret}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline"
                    style={{ color: theme.producerColor }}
                  >
                    Simulate Scan
                    <ArrowUpRightIcon size={11} />
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
