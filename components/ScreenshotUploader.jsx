"use client";
import { useState, useRef } from "react";
import { Upload, ImageIcon, Loader2, Zap, CheckCircle, X, AlertCircle } from "lucide-react";

export default function ScreenshotUploader({ onExtracted, onClose }) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState("");
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Please upload an image file (PNG, JPG, WebP, etc.)");
      return;
    }
    setFile(f);
    setStatus(null);
    setMessage("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Extraction failed");
      }

      setStatus("success");
      setMessage("AI extraction successful! Fields auto-filled below.");

      // Pass extracted data to parent form
      if (data.extracted) {
        onExtracted(data.extracted);
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Failed to extract. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Screenshot Extractor</p>
            <p className="text-xs text-slate-500">Drop a hackathon ad image to auto-fill the form</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        id="screenshot-drop-zone"
        className={`drop-zone rounded-xl cursor-pointer transition-all duration-300 ${
          dragOver ? "drag-over scale-[1.02]" : ""
        } ${preview ? "p-2" : "p-8"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          id="screenshot-file-input"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Screenshot preview"
              className="w-full max-h-48 object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-medium">Click to change</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <ImageIcon className="w-7 h-7 text-cyan-400" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Drop your hackathon screenshot here
            </p>
            <p className="text-xs text-slate-500">
              PNG, JPG, WebP, GIF up to 10MB
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
              <Upload className="w-3.5 h-3.5" />
              Click to browse or drag & drop
            </div>
          </div>
        )}
      </div>

      {/* Status messages */}
      {status === "success" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {message}
        </div>
      )}

      {/* Extract button */}
      {file && (
        <button
          id="extract-btn"
          onClick={handleExtract}
          disabled={loading}
          className="w-full btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting with AI...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Extract Hackathon Details</span>
            </>
          )}
        </button>
      )}

      <p className="text-[11px] text-slate-600 text-center">
        Powered by Gemini Vision API · Works best with clear, high-res screenshots
      </p>
    </div>
  );
}
