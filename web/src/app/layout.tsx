import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BatchSnap 📦⚡ | Web3 Batch Provenance & Cryptographic Label Studio",
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
      <body className="relative min-h-screen bg-[#09090b] text-slate-300 antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
        
        {/* Web3 Background Elements */}
        <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden print:hidden">
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f462e_1px,transparent_1px),linear-gradient(to_bottom,#3f3f462e_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          {/* Top Center Glow (Cyan) */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-cyan-600/15 blur-[120px]" />

          {/* Bottom Right Glow (Indigo) */}
          <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>

        {children}
      </body>
    </html>
  );
}
