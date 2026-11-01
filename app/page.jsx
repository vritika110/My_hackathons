"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Zap,
  Bell,
  Trophy,
  Users,
  Clock,
  Search,
  SortAsc,
  RefreshCw,
  Camera,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import HackathonCard from "@/components/HackathonCard";
import AddHackathonModal from "@/components/AddHackathonModal";
import ScreenshotUploader from "@/components/ScreenshotUploader";

export default function DashboardPage() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [prefillData, setPrefillData] = useState({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("registrationDeadline");
  const [alertStatus, setAlertStatus] = useState(null);
  const [alertLoading, setAlertLoading] = useState(false);

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hackathons");
      const data = await res.json();
      setHackathons(Array.isArray(data) ? data : []);
    } catch {
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Direct load — no login required
  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  const handleAdd = (newHackathon) => {
    setHackathons((prev) => [newHackathon, ...prev]);
  };

  const handleDelete = (id) => {
    setHackathons((prev) => prev.filter((h) => h.id !== id));
  };

  const handleExtracted = (data) => {
    setPrefillData(data);
    setShowUploader(false);
    setShowModal(true);
  };

  const handleTestAlerts = async () => {
    setAlertLoading(true);
    setAlertStatus(null);
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlertStatus({
        ok: res.ok,
        message: data.message || (res.ok ? "Alert check completed" : "Alert error"),
      });
    } catch (err) {
      setAlertStatus({ ok: false, message: err.message });
    } finally {
      setAlertLoading(false);
    }
  };

  // Filter + sort
  const filtered = hackathons
    .filter((h) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        h.name?.toLowerCase().includes(q) ||
        h.platform?.toLowerCase().includes(q) ||
        h.teamMembers?.some((m) => m.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sort === "registrationDeadline") {
        return new Date(a.registrationDeadline || "9999") - new Date(b.registrationDeadline || "9999");
      }
      if (sort === "prizePool") {
        const parseAmt = (s) => parseFloat((s || "0").replace(/[^0-9.]/g, "")) || 0;
        return parseAmt(b.prizePool) - parseAmt(a.prizePool);
      }
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  // Stats
  const upcoming = hackathons.filter((h) => {
    if (!h.registrationDeadline) return false;
    return new Date(h.registrationDeadline) >= new Date();
  }).length;

  const urgent = hackathons.filter((h) => {
    if (!h.registrationDeadline) return false;
    const days = Math.ceil(
      (new Date(h.registrationDeadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return days >= 0 && days <= 3;
  }).length;

  const totalTeammates = new Set(
    hackathons.flatMap((h) => h.teamMembers || [])
  ).size;

  return (
    <div className="min-h-screen bg-[#080812]">
      {/* Background orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[180px] pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-violet-500/10 bg-[#080812]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-900/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-none">HackTracker</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                vritika110@gmail.com
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
              <span>vritika110@gmail.com</span>
            </div>

            {/* Test alerts button */}
            <button
              id="test-alerts-btn"
              onClick={handleTestAlerts}
              disabled={alertLoading}
              title="Run deadline alert check"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-ghost text-xs"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>{alertLoading ? "Checking..." : "Test Alerts"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Alert status toast */}
      {alertStatus && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl text-sm shadow-xl border backdrop-blur-sm fade-in-up ${
            alertStatus.ok
              ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-300"
              : "bg-red-900/80 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {alertStatus.message}
            <button onClick={() => setAlertStatus(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── HERO ── */}
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-black mb-2">
            <span className="text-white">My </span>
            <span className="gradient-text">Hackathons</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Track deadlines, prizes, and team members across all your hackathons.
          </p>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total", value: hackathons.length, icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10" },
            { label: "Upcoming", value: upcoming, icon: Clock, color: "text-violet-400", bg: "bg-violet-400/10" },
            { label: "Urgent (≤3d)", value: urgent, icon: Bell, color: "text-red-400", bg: "bg-red-400/10" },
            { label: "Teammates", value: totalTeammates, icon: Users, color: "text-cyan-400", bg: "bg-cyan-400/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── AI SCREENSHOT UPLOADER ── */}
        {showUploader && (
          <div className="mb-6 glass-card rounded-2xl p-6 border-cyan-500/20 fade-in-up">
            <ScreenshotUploader
              onExtracted={handleExtracted}
              onClose={() => setShowUploader(false)}
            />
          </div>
        )}

        {/* ── TOOLBAR ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hackathons, platforms, team members..."
              className="dark-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="dark-input appearance-none rounded-xl pl-9 pr-8 py-2.5 text-sm cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="registrationDeadline">Sort: Reg. Deadline</option>
              <option value="prizePool">Sort: Prize Pool</option>
              <option value="name">Sort: Name</option>
              <option value="createdAt">Sort: Recently Added</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          {/* AI Extract */}
          <button
            id="ai-extract-btn"
            onClick={() => setShowUploader((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all text-sm font-medium"
          >
            <Camera className="w-4 h-4" />
            AI Extract
          </button>

          {/* Add Hackathon */}
          <button
            id="add-hackathon-btn"
            onClick={() => {
              setPrefillData({});
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hackathon</span>
          </button>
        </div>

        {/* ── HACKATHON GRID ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-violet-500/10 h-64 shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-6 float-animation">
              <Trophy className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {search ? "No hackathons found" : "No hackathons yet!"}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {search
                ? `No results for "${search}". Try a different search.`
                : "Add your first hackathon to start tracking deadlines and prizes."}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setPrefillData({});
                  setShowModal(true);
                }}
                className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm"
              >
                <span>+ Add Your First Hackathon</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-600 mb-4">
              Showing {filtered.length} of {hackathons.length} hackathon{hackathons.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((hackathon, i) => (
                <HackathonCard
                  key={hackathon.id}
                  hackathon={hackathon}
                  onDelete={handleDelete}
                  index={i}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── MODALS ── */}
      {showModal && (
        <AddHackathonModal
          onClose={() => {
            setShowModal(false);
            setPrefillData({});
          }}
          onAdd={handleAdd}
          initialData={prefillData}
        />
      )}

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-violet-500/10 text-center">
        <p className="text-xs text-slate-700">
          ⚡ HackTracker · Built for vritika110@gmail.com ·{" "}
          <button
            onClick={fetchHackathons}
            className="inline-flex items-center gap-1 hover:text-violet-400 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </p>
      </footer>
    </div>
  );
}
