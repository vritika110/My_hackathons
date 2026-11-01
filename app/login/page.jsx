"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Zap, Shield, Trophy, Users } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleDemoSignIn = () => {
    // For demo mode — just navigate home (demo session is injected server-side)
    window.location.href = "/";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080812]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    { icon: Trophy, label: "Track Prize Pools", color: "text-yellow-400" },
    { icon: Shield, label: "Deadline Alerts", color: "text-red-400" },
    { icon: Users, label: "Team Members", color: "text-purple-400" },
    { icon: Zap, label: "AI Screenshot OCR", color: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080812] relative overflow-hidden px-4">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-600/5 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 mb-6 shadow-2xl shadow-violet-900/50">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">HackTracker</h1>
          <p className="text-slate-400 text-sm">
            Your personal hackathon command center
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {features.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs"
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-slate-300">{label}</span>
            </div>
          ))}
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">
            Welcome back, Vritika 👋
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Sign in with your Google account to access your hackathon dashboard.
            Only{" "}
            <span className="text-violet-400 font-medium">
              vritika110@gmail.com
            </span>{" "}
            is authorized.
          </p>

          {/* Google Sign In Button */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-white text-gray-800 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Demo mode button */}
          <button
            id="demo-signin-btn"
            onClick={handleDemoSignIn}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-500/10 transition-all duration-200"
          >
            <Zap className="w-4 h-4" />
            Enter Demo Mode (No OAuth Required)
          </button>

          <p className="text-center text-xs text-slate-600 mt-6">
            🔐 Secured with Google OAuth 2.0 · Sessions last 30 days
          </p>
        </div>
      </div>
    </div>
  );
}
