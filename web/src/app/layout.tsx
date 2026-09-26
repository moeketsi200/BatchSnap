import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BatchSnap 📦⚡ | No-Code Batch Provenance & Anti-Counterfeit Labels",
  description:
    "Create immutable product records, anchor them to public Layer 2 chains, and generate print-ready cryptographic labels in under 60 seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
