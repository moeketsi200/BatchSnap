"use client";

import React from "react";
import QRCode from "qrcode";
import { type EmblemIconName, renderEmblemPaths } from "./LucideIcons";

export interface QrMatrixSvgProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  emblemIcon?: EmblemIconName;
  showBadge?: boolean;
  className?: string;
}

/**
 * Renders a 100% real, camera-scannable ISO/IEC 18004 QR code as a crisp vector SVG
 * using the `qrcode` library, with support for custom ink colors and an embedded
 * Lucide vector outline icon badge in the center.
 */
export function QrMatrixSvg({
  value,
  size = 88,
  fgColor = "#1B4332",
  bgColor = "#FFFFFF",
  emblemIcon = "shield-check",
  showBadge = false,
  className = "",
}: QrMatrixSvgProps) {
  const qrData = React.useMemo(() => {
    try {
      const qr = QRCode.create(value || "https://batchsnap.app", {
        errorCorrectionLevel: showBadge ? "H" : "M",
      });
      const moduleCount = qr.modules.size;
      const rawData = qr.modules.data;
      const cells: Array<{ x: number; y: number }> = [];

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (rawData[r * moduleCount + c]) {
            cells.push({ x: c, y: r });
          }
        }
      }
      return { moduleCount, cells };
    } catch {
      return { moduleCount: 21, cells: [] };
    }
  }, [value, showBadge]);

  const quietZone = 2;
  const totalViewSize = qrData.moduleCount + quietZone * 2;
  const centerPos = totalViewSize / 2;
  const badgeBoxSize = totalViewSize * 0.25;
  const iconPadding = badgeBoxSize * 0.16;
  const iconScale = (badgeBoxSize - iconPadding * 2) / 24;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalViewSize} ${totalViewSize}`}
      shapeRendering="crispEdges"
      className={className}
      aria-label={`Scannable QR Code for ${value}`}
    >
      <rect
        width={totalViewSize}
        height={totalViewSize}
        fill={bgColor}
        rx={1.5}
      />
      {qrData.cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.x + quietZone}
          y={cell.y + quietZone}
          width={1}
          height={1}
          fill={fgColor}
        />
      ))}

      {showBadge && (
        <g shapeRendering="geometricPrecision">
          <rect
            x={centerPos - badgeBoxSize / 2}
            y={centerPos - badgeBoxSize / 2}
            width={badgeBoxSize}
            height={badgeBoxSize}
            rx={1.4}
            fill={bgColor}
            stroke={fgColor}
            strokeWidth={0.45}
          />
          <g
            transform={`translate(${centerPos - badgeBoxSize / 2 + iconPadding}, ${
              centerPos - badgeBoxSize / 2 + iconPadding
            }) scale(${iconScale})`}
            fill="none"
            stroke={fgColor}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {renderEmblemPaths(emblemIcon)}
          </g>
        </g>
      )}
    </svg>
  );
}
