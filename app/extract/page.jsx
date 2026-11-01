"use client";

/**
 * AI Screenshot Extractor — wrapper page
 * Accessible at /extract for direct deep-link
 */
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ScreenshotUploader from "@/components/ScreenshotUploader";
import { useState } from "react";
import AddHackathonModal from "@/components/AddHackathonModal";

export default function ExtractPage() {
  const router = useRouter();
  const [prefill, setPrefill] = useState(null);

  const handleExtracted = (data) => {
    setPrefill(data);
  };

  return (
    <div className="min-h-screen bg-[#080812] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-black text-white mb-2">
          AI Screenshot Extractor
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Upload a hackathon flyer or ad screenshot. Gemini Vision will
          automatically extract the prize pool, platform, registration deadline,
          and submission deadline.
        </p>

        <div className="glass-card rounded-2xl p-6">
          <ScreenshotUploader
            onExtracted={handleExtracted}
            onClose={() => router.push("/")}
          />
        </div>

        {prefill && (
          <AddHackathonModal
            initialData={prefill}
            onClose={() => setPrefill(null)}
            onAdd={() => {
              setPrefill(null);
              router.push("/");
            }}
          />
        )}
      </div>
    </div>
  );
}
