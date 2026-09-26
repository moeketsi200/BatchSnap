import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BatchSnap 📦⚡ | Artisanal Batch Provenance & Cryptographic Label Studio",
  description:
    "Create immutable product records, anchor them to public Layer 2 chains, and print customizable cryptographic QR labels in under 60 seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#09090b] text-slate-300 antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
