import { randomBytes } from "node:crypto";
import type { SerializedLabelUnit } from "./types.ts";

// Keccak-256 round constants (64-bit BigInts)
const RC: bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTC: number[] = [
  1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];

const PILN: number[] = [
  10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];

const MASK_64 = 0xffffffffffffffffn;

function rotl64(x: bigint, n: number): bigint {
  return ((x << BigInt(n)) | (x >> BigInt(64 - n))) & MASK_64;
}

function keccakF1600(state: bigint[]): void {
  const bc = new Array<bigint>(5);
  for (let round = 0; round < 24; round++) {
    // Theta
    for (let i = 0; i < 5; i++) {
      bc[i] =
        state[i] ^
        state[i + 5] ^
        state[i + 10] ^
        state[i + 15] ^
        state[i + 20];
    }
    for (let i = 0; i < 5; i++) {
      const t = bc[(i + 4) % 5] ^ rotl64(bc[(i + 1) % 5], 1);
      for (let j = 0; j < 25; j += 5) {
        state[j + i] = (state[j + i] ^ t) & MASK_64;
      }
    }

    // Rho & Pi
    let t = state[1];
    for (let i = 0; i < 24; i++) {
      const j = PILN[i];
      bc[0] = state[j];
      state[j] = rotl64(t, ROTC[i]);
      t = bc[0];
    }

    // Chi
    for (let j = 0; j < 25; j += 5) {
      for (let i = 0; i < 5; i++) {
        bc[i] = state[j + i];
      }
      for (let i = 0; i < 5; i++) {
        state[j + i] =
          (state[j + i] ^ (~bc[(i + 1) % 5] & bc[(i + 2) % 5])) & MASK_64;
      }
    }

    // Iota
    state[0] = (state[0] ^ RC[round]) & MASK_64;
  }
}

/**
 * Computes Ethereum Keccak-256 hash (`0x01` domain separator), identical to
 * Solidity's `keccak256(abi.encodePacked(input))`.
 */
export function keccak256Bytes(input: Uint8Array): `0x${string}` {
  const rate = 136; // 1088 bits = 136 bytes
  const state = new Array<bigint>(25).fill(0n);

  const paddedLen = Math.ceil((input.length + 1) / rate) * rate;
  const padded = new Uint8Array(paddedLen);
  padded.set(input);
  padded[input.length] = 0x01; // Original Keccak padding (used by Ethereum/Solidity)
  padded[paddedLen - 1] |= 0x80;

  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  for (let offset = 0; offset < paddedLen; offset += rate) {
    for (let i = 0; i < rate / 8; i++) {
      const lane = view.getBigUint64(offset + i * 8, true);
      state[i] = (state[i] ^ lane) & MASK_64;
    }
    keccakF1600(state);
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 4; i++) {
    outView.setBigUint64(i * 8, state[i], true);
  }

  let hex = "0x";
  for (const b of out) {
    hex += b.toString(16).padStart(2, "0");
  }
  return hex as `0x${string}`;
}

/**
 * Computes `keccak256(abi.encodePacked(secret))` for a UTF-8 secret string.
 */
export function hashSecret(secret: string): `0x${string}` {
  const bytes = new TextEncoder().encode(secret);
  return keccak256Bytes(bytes);
}

/**
 * Generates a random lowercase hex secret (default 4 bytes = 8 hex characters, e.g., `a8f9c1e0`).
 */
export function generateSecret(byteLength = 4): string {
  return randomBytes(byteLength).toString("hex");
}

/**
 * Constructs the consumer verification URL encoded inside each printed QR code.
 */
export function buildVerifyUrl(
  baseUrl: string,
  batchId: number,
  secret: string
): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return `${normalizedBase}/v/${batchId}?secret=${encodeURIComponent(secret)}`;
}

/**
 * Generates an array of `unitCount` serialized QR label secrets and hashes for a batch.
 */
export function generateSerializedLabels(
  batchId: number,
  unitCount: number,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://batchsnap.app"
): SerializedLabelUnit[] {
  const safeCount = Math.max(1, Math.min(unitCount, 1000));
  const units: SerializedLabelUnit[] = [];
  const usedSecrets = new Set<string>();

  for (let i = 1; i <= safeCount; i++) {
    let secret = generateSecret(4);
    while (usedSecrets.has(secret)) {
      secret = generateSecret(4);
    }
    usedSecrets.add(secret);

    units.push({
      unitNumber: i,
      secret,
      secretHash: hashSecret(secret),
      verifyUrl: buildVerifyUrl(baseUrl, batchId, secret),
    });
  }

  return units;
}
