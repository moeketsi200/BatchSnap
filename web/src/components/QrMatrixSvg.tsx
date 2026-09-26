"use client";

import React from "react";

interface QrMatrixSvgProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Deterministic 21x21 QR-style vector matrix SVG with canonical finder patterns,
 * timing bars, and URL-seeded data modules for instant zero-latency vector printing.
 */
export function QrMatrixSvg({
  value,
  size = 88,
  className = "",
}: QrMatrixSvgProps) {
  const gridSize = 21;

  const cells = React.useMemo(() => {
    const matrix: boolean[][] = Array.from({ length: gridSize }, () =>
      Array<boolean>(gridSize).fill(false)
    );
    const reserved: boolean[][] = Array.from({ length: gridSize }, () =>
      Array<boolean>(gridSize).fill(false)
    );

    const placeFinder = (rowOffset: number, colOffset: number) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = rowOffset + r;
          const cc = colOffset + c;
          if (rr < 0 || rr >= gridSize || cc < 0 || cc >= gridSize) continue;
          reserved[rr][cc] = true;
          const inOuter =
            r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6);
          const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[rr][cc] = inOuter || inInner;
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(0, gridSize - 7);
    placeFinder(gridSize - 7, 0);

    for (let i = 8; i < gridSize - 8; i++) {
      reserved[6][i] = true;
      reserved[i][6] = true;
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    let seed = 2166136261;
    for (let i = 0; i < value.length; i++) {
      seed ^= value.charCodeAt(i);
      seed = Math.imul(seed, 16777619) >>> 0;
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (reserved[r][c]) continue;
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        const charFactor = value.charCodeAt((r * gridSize + c) % value.length);
        matrix[r][c] = ((seed >>> 0) ^ charFactor) % 2 === 0;
      }
    }

    return matrix;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize + 2} ${gridSize + 2}`}
      shapeRendering="crispEdges"
      className={className}
      aria-label={`QR Code for ${value}`}
    >
      <rect width={gridSize + 2} height={gridSize + 2} fill="#ffffff" rx={1} />
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + 1}
              y={rIdx + 1}
              width={1}
              height={1}
              fill="#090d16"
            />
          ) : null
        )
      )}
    </svg>
  );
}
