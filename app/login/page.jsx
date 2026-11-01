"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Direct access — redirect straight to dashboard
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080812]">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
