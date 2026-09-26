import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BatchSnap | Web3 Provenance Studio",
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
      <body className="relative min-h-screen bg-[#050505] text-slate-300 antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
        
        {/* Premium Web3 Animated Background */}
        <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden print:hidden">
          {/* Animated Glass/Aurora Blobs */}
          <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-600/20 blur-[120px] animate-blob mix-blend-screen" />
          <div className="absolute top-[20%] right-[-10%] h-[700px] w-[700px] rounded-full bg-fuchsia-600/15 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen" />
          <div className="absolute bottom-[-20%] left-[20%] h-[800px] w-[800px] rounded-full bg-emerald-600/15 blur-[120px] animate-blob animation-delay-4000 mix-blend-screen" />
          
          {/* Sharp Tech Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />

          {/* Premium Matte Noise Overlay */}
          <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-40" />
        </div>

        {children}
      </body>
    </html>
  );
}
