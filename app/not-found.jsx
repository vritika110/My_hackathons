"use client";
import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080812] px-4">
      <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-violet-600/8 rounded-full blur-[120px]" />
      <div className="relative text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-6">
          <Zap className="w-10 h-10 text-violet-400" />
        </div>
        <p className="text-7xl font-black gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-8">
          This page doesn't exist. Head back to your hackathon dashboard.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-all font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
