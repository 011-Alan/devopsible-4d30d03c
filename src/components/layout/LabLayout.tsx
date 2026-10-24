import React from "react";
import { AppNavbar } from "./AppNavbar";

interface LabLayoutProps {
  children: React.ReactNode;
}

export function LabLayout({ children }: LabLayoutProps) {
  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Background Cyber Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1e293b 1px, transparent 1px),
            linear-gradient(to bottom, #1e293b 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
        }}
      />

      {/* Subtle top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-cyan-900/10 via-indigo-900/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Top Navbar */}
      <AppNavbar />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full">{children}</main>
    </div>
  );
}
