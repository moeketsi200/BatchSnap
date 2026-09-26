"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type {
  CreateBatchResponse,
  LabelTemplateType,
  ProductCategory,
} from "@/lib/types";
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
    emoji: string;
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
  forest: {
    name: "Botanical Forest",
    emoji: "🌲",
    swatch: "#1B4332",
    qrFg: "#1B4332",
    qrBg: "#FFFDF9",
    badgeBg: "#1B4332",
    badgeText: "#FAF6F0",
    producerColor: "#2D6A4F",
    borderColor: "#B7C9BD",
    accentPillBg: "#E9F5EE",
    accentPillText: "#1B4332",
  },
  espresso: {
    name: "Artisan Espresso",
    emoji: "☕",
    swatch: "#3E2723",
    qrFg: "#2B1B17",
    qrBg: "#FFFDF9",
    badgeBg: "#3E2723",
    badgeText: "#FDF8F5",
    producerColor: "#6D4C41",
    borderColor: "#D7CCC8",
    accentPillBg: "#F5EBE6",
    accentPillText: "#3E2723",
  },
  terracotta: {
    name: "Harvest Terracotta",
    emoji: "🏺",
    swatch: "#9A3412",
    qrFg: "#7C2D12",
    qrBg: "#FFFDF9",
    badgeBg: "#9A3412",
    badgeText: "#FFF7ED",
    producerColor: "#B45309",
    borderColor: "#FCD34D",
    accentPillBg: "#FEF3C7",
    accentPillText: "#92400E",
  },
  monochrome: {
    name: "Thermal Ink Black",
    emoji: "🖤",
    swatch: "#111827",
    qrFg: "#090D16",
    qrBg: "#FFFFFF",
    badgeBg: "#111827",
    badgeText: "#FFFFFF",
    producerColor: "#374151",
    borderColor: "#D1D5DB",
    accentPillBg: "#F3F4F6",
    accentPillText: "#111827",
  },
};

const CATEGORY_BADGE_EMBLEM: Record<ProductCategory, string> = {
  honey: "🍯",
  coffee: "☕",
  "olive-oil": "🫒",
  cosmetics: "🌿",
  "wine-spirits": "🍷",
  other: "✨",
};

const EMOJI_PALETTE = [
  "🍯",
  "🐝",
  "☕",
  "🫒",
  "🌿",
  "🍷",
  "🍫",
  "🌶️",
  "🧀",
  "🌱",
  "✨",
  "🛡️",
  "👑",
  "🏔️",
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
  const [selectedEmoji, setSelectedEmoji] = useState<string>(
    CATEGORY_BADGE_EMBLEM[batchData.metadata.category] || "🍯"
  );
  const [customSealText, setCustomSealText] = useState<string>(
    "VERIFIED ORIGIN"
  );

  useEffect(() => {
    setSelectedEmoji(
      CATEGORY_BADGE_EMBLEM[batchData.metadata.category] || "✨"
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
      <div className="no-print rounded-3xl border border-[#E2D9C5] bg-[#FFFDF9] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE8D8] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/10 px-3 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-800/20">
                ✨ Batch #{batchData.batchId} Anchored
              </span>
              <span className="text-xs font-mono text-stone-500">
                🏷️ {batchData.labels.length} Serialized Stickers
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-600">
              📱 Real camera-scannable ISO QR codes • Customize your sticker emoji, colors &amp; border below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {batchData.labels[0] && (
              <Link
                href={`/v/${batchData.batchId}?secret=${batchData.labels[0].secret}`}
                target="_blank"
                className="rounded-xl border border-emerald-800/30 bg-emerald-50/80 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition"
              >
                🔍 Test Scan Unit #1
              </Link>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-bold text-[#FAF6F0] shadow-sm hover:bg-[#2D6A4F] transition"
            >
              🖨️ Print / Save PDF Sheet
            </button>
          </div>
        </div>

        {/* Emoji Emblem Picker Bar */}
        <div className="rounded-2xl border border-[#EFE8D8] bg-[#FAF6F0] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600">
              🎨 Pick Sticker &amp; QR Center Emoji Emblem
            </span>
            <span className="text-[11px] text-stone-500">
              Active Emblem: <strong className="text-base">{selectedEmoji}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {EMOJI_PALETTE.map((emoji) => {
              const active = selectedEmoji === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setSelectedEmoji(emoji);
                    setShowCenterBadge(true);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition ${
                    active
                      ? "border-[#1B4332] bg-[#1B4332] text-white shadow-sm scale-105"
                      : "border-[#D8CEB8] bg-white hover:border-stone-400"
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customization Controls Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {/* 1. Sheet Template */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1.5">
              📐 Label Sheet Format
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as LabelTemplateType)}
              className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3 py-2 text-xs font-semibold text-stone-800 focus:border-[#1B4332] focus:outline-none"
            >
              <option value="avery-5160">📄 Avery 5160 (30-up Sheet)</option>
              <option value="avery-5163">📦 Avery 5163 (10-up Large Jar)</option>
              <option value="thermal-roll">🎞️ 2&quot; × 2&quot; Thermal Roll</option>
            </select>
          </div>

          {/* 2. Color Palette */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1.5">
              🎨 Ink &amp; Seal Palette
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
                    className={`flex items-center gap-1 rounded-xl border px-2 py-1.5 font-semibold transition ${
                      active
                        ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                        : "border-[#D8CEB8] bg-[#FAF6F0] text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <span>{item.emoji}</span>
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
            <label className="block font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1.5">
              ✂️ Border / Frame Style
            </label>
            <select
              value={borderStyle}
              onChange={(e) =>
                setBorderStyle(e.target.value as StickerBorderStyle)
              }
              className="w-full rounded-xl border border-[#D8CEB8] bg-[#FAF6F0] px-3 py-2 text-xs font-semibold text-stone-800 focus:border-[#1B4332] focus:outline-none"
            >
              <option value="dashed">✂️ Perforated Craft Cut (Dashed)</option>
              <option value="double">🏛️ Apothecary Double Frame</option>
              <option value="stamp">🏵️ Estate Wax Stamp (Rounded)</option>
              <option value="solid">📏 Minimal Hairline (Solid)</option>
            </select>
          </div>

          {/* 4. Seal & Badge Toggles */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1.5">
              🛡️ QR Logo &amp; Security Strip
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCenterBadge((v) => !v)}
                className={`flex-1 rounded-xl border px-2.5 py-2 font-semibold transition ${
                  showCenterBadge
                    ? "border-emerald-800 bg-emerald-900/10 text-emerald-950"
                    : "border-[#D8CEB8] bg-[#FAF6F0] text-stone-500"
                }`}
              >
                {showCenterBadge ? `${selectedEmoji} QR Logo` : "🚫 No Logo"}
              </button>
              <button
                type="button"
                onClick={() => setShowScratchPin((v) => !v)}
                className={`flex-1 rounded-xl border px-2.5 py-2 font-semibold transition ${
                  showScratchPin
                    ? "border-amber-800 bg-amber-900/10 text-amber-950"
                    : "border-[#D8CEB8] bg-[#FAF6F0] text-stone-500"
                }`}
              >
                {showScratchPin ? "🔐 PIN On" : "🚫 PIN Off"}
              </button>
            </div>
          </div>
        </div>

        {/* Custom Seal Banner Text */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-600">
              🏅 Seal Ribbon Text:
            </span>
            <input
              type="text"
              maxLength={24}
              value={customSealText}
              onChange={(e) => setCustomSealText(e.target.value)}
              className="rounded-lg border border-[#D8CEB8] bg-[#FAF6F0] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-stone-800 focus:border-[#1B4332] focus:outline-none"
            />
          </div>
          <span className="font-mono text-[11px] text-stone-500">
            📌 IPFS CID: {batchData.ipfsCID.slice(0, 22)}…
          </span>
        </div>
      </div>

      {/* Printable Label Sheet Surface */}
      <div className="print-sheet rounded-3xl border border-[#E2D9C5] bg-white p-6 text-stone-900 shadow-md">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3 text-xs text-stone-500">
          <span>
            🖨️ Print Sheet Preview:{" "}
            <strong className="text-stone-800 uppercase">{template}</strong> •{" "}
            {selectedEmoji} {batchData.metadata.productName} (
            {batchData.metadata.batchCode})
          </span>
          <span className="text-[11px] text-emerald-800 font-semibold">
            📷 Point your phone camera at any QR code below to verify
          </span>
        </div>

        <div className={`grid ${gridClass}`}>
          {batchData.labels.map((unit) => (
            <div
              key={unit.unitNumber}
              style={{ borderColor: theme.borderColor }}
              className={`print-label-card relative flex items-center gap-3 bg-[#FFFDF9] p-3.5 transition hover:shadow-md ${borderCss}`}
            >
              {/* Scannable Vector QR Code */}
              <div
                className="shrink-0 rounded-xl border p-1.5 bg-white shadow-sm"
                style={{ borderColor: theme.borderColor }}
              >
                <QrMatrixSvg
                  value={unit.verifyUrl}
                  size={template === "avery-5163" ? 96 : 78}
                  fgColor={theme.qrFg}
                  bgColor={theme.qrBg}
                  badgeText={selectedEmoji}
                  showBadge={showCenterBadge}
                />
              </div>

              {/* Artisanal Label Typography */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="truncate text-[10px] font-extrabold uppercase tracking-widest"
                    style={{ color: theme.producerColor }}
                  >
                    {selectedEmoji} {batchData.metadata.producerName}
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

                <p className="truncate text-sm font-black text-stone-900 mt-0.5">
                  {batchData.metadata.productName}
                </p>

                <p className="text-[11px] font-medium text-stone-600 truncate">
                  📍 {batchData.metadata.originRegion} • 🗓️{" "}
                  {batchData.metadata.harvestOrProductionDate}
                </p>

                <div className="mt-1.5 flex items-center justify-between gap-1.5">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                    style={{
                      backgroundColor: theme.accentPillBg,
                      color: theme.accentPillText,
                    }}
                  >
                    🛡️ {customSealText || "VERIFIED ORIGIN"}
                  </span>

                  {showScratchPin && (
                    <span className="rounded border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-700">
                      🔐 <strong className="text-stone-950">{unit.secret}</strong>
                    </span>
                  )}
                </div>

                <div className="no-print mt-1.5 flex items-center justify-end border-t border-stone-200/70 pt-1">
                  <Link
                    href={`/v/${batchData.batchId}?secret=${unit.secret}`}
                    target="_blank"
                    className="text-[10px] font-bold hover:underline"
                    style={{ color: theme.producerColor }}
                  >
                    📲 Simulate Scan →
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
