# BatchSnap 📦⚡

> **No-code batch provenance and anti-counterfeit label generator for small producers.**  
> Create immutable product records, anchor them to public Layer 2 chains, and generate print-ready cryptographic labels in under 60 seconds.

---

## 📌 Problem & Vision

Small producers (coffee roasters, honey harvesters, olive oil estates, boutique cosmetics makers) face growing threats from counterfeiters and gray-market dilution. Enterprise traceability systems (SAP, Oracle, Hyperledger) require expensive vendor contracts, complex server infrastructure, and dedicated IT teams.

**BatchSnap** solves this with a mobile-first, zero-overhead utility:
1. **Producer Side:** Snap a photo of a batch, enter key attributes, and immediately export serialized, print-ready label sheets.
2. **Consumer Side:** Scan a tamper-evident QR code with any standard smartphone camera to verify authenticity and origin directly in the browser—no Web3 wallet, app download, or gas fees required.

---

## ✨ Features

- **No-Code Batch Creation:** Minimal form design tailored for field use. Takes less than a minute on a mobile screen.
- **Decentralized Storage:** Batch metadata, lab certificates (CoAs), and production photos are pinned to IPFS.
- **Low-Cost Layer 2 Anchoring:** Stores only the immutable CID hash on-chain (Arbitrum, Base, or Polygon), costing fractions of a cent per batch.
- **Print-Ready PDF Export:** Automatically compiles serialized QR codes into standard Avery label templates or roll formats for immediate inkjet/thermal printing.
- **Single-Claim Anti-Counterfeiting:** Detects duplicate scans. If a bad actor prints 50 copies of a single QR code, the first scan claims the genuine token and subsequent scans flash a warning.
- **Zero-Friction Consumer Portal:** Serverless, read-only static verification web page that queries the blockchain contract via public RPCs.

---

## 🏗️ Architecture

```text
[ Producer Mobile App ]
  │
  ├── 1. Upload Assets & Metadata ──> [ IPFS / Pinata Gateway ]
  │                                             │
  │                                         (CID Hash)
  │                                             │
  ├── 2. Mint Batch Token (CID) ────> [ Layer 2 Smart Contract ]
  │                                             │
  └── 3. Generate Vector Labels                 │
        │                                       │
  [ Printable PDF (QR) ]                        │
        │                                       │
  [ Consumer Phone ] ──── 4. Scan QR ──> [ Web Verification App ]
                                                │
                                         5. Free eth_call RPC
                                                │
                                        [ Verified Origin ]
```

---

## 🚀 Tech Stack

- **Frontend & App:** Next.js / React Native (Capacitor), Tailwind CSS
- **Smart Contracts:** Solidity (ERC-1155 Batch Registry via Foundry / OpenZeppelin)
- **Decentralized Storage:** IPFS via Pinata / Helia
- **Label Generation:** `@react-pdf/renderer` & `qrcode`
- **Chain Integration:** `viem` / `wagmi` (Base / Arbitrum / Polygon)
- **Hosting:** Vercel / Cloudflare Pages

---

## 📂 Repository Structure

```text
BatchSnap/
├── contracts/             # Foundry project: Smart contracts & deployment scripts
│   ├── src/
│   │   └── BatchRegistry.sol
│   └── test/
├── web/                   # Next.js producer dashboard & consumer verification portal
│   ├── src/
│   │   ├── app/
│   │   │   ├── (producer)/# Batch creation & label print flows
│   │   │   └── v/[id]/    # Consumer verification screen
│   │   ├── components/    # Reusable UI & label renderers
│   │   └── lib/           # IPFS pinning & RPC client logic
└── package.json
```

---

## ⚙️ Quickstart

### Prerequisites
- Node.js >= 18.x
- Foundry (for smart contract tests)
- A Pinata API key (or any IPFS pinning provider)

### 1. Clone the repository

```bash
git clone git@github.com:moeketsi200/BatchSnap.git
cd BatchSnap
```

### 2. Environment Configuration

Create a `.env.local` file inside the `web/` directory:

```env
NEXT_PUBLIC_CHAIN_ID=84532               # e.g., Base Sepolia
NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_CONTRACT_ADDRESS="0x..."
PINATA_JWT="your_pinata_jwt_here"
```

### 3. Install Dependencies & Run

```bash
# Install root and app dependencies
npm install

# Run the Next.js local development server
npm run dev --prefix web
```

Navigate to `http://localhost:3000` to access the producer dashboard.

---

## 📄 Smart Contract Spec (`BatchRegistry.sol`)

The batch registry uses a gas-minimized model where batches are stored as lightweight structs linked to an IPFS CID:

```solidity
struct Batch {
    uint256 batchId;
    address producer;
    string ipfsCID;        // Points to JSON containing dates, images, and lab tests
    bytes32 secretHash;    // Keccak256 hash of single-use validation secret
    uint256 createdAt;
    bool isClaimed;
}
```

---

## 🛡️ Anti-Counterfeit Verification Logic

Each printed label encodes a URL with two parameters:

```text
https://batchsnap.app/v/1024?secret=a8f9c1e0
```

When the consumer scans the item, the verification page sends the secret to the validation endpoint or smart contract:
- **If `hash(secret) == secretHash` and `isClaimed == false`:** ✅ Green Checkmark (*100% Genuine*). State updates to claimed.
- **If already claimed:** ⚠️ Yellow / Red Warning (*"This code was already verified on [Timestamp]. Possible duplicate."*).

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.