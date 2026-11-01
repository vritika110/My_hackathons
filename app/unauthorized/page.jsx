"use client";
import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080812] px-4">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-600/8 rounded-full blur-[120px]" />
      <div className="relative text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/25 mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-2">
          This dashboard is exclusively for{" "}
          <span className="text-violet-400 font-semibold">vritika110@gmail.com</span>.
        </p>
        <p className="text-slate-600 text-xs mb-8">
          If you believe this is an error, please sign in with the correct Google account.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-all font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </div>
    </div>
  );
}
