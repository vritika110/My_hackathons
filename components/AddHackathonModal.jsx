"use client";
import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  DollarSign,
  Globe,
  Users,
  Trophy,
  FileText,
  ExternalLink,
  Loader2,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  platform: "",
  platformUrl: "",
  registrationDeadline: "",
  submissionDeadline: "",
  prizePool: "",
  teamMembers: "",
  description: "",
};

export default function AddHackathonModal({ onClose, onAdd, initialData = {} }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teamInput, setTeamInput] = useState("");
  const [teamList, setTeamList] = useState([]);

  // Sync initialData when passed (e.g. from AI extraction)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));

      if (initialData.teamMembers) {
        if (Array.isArray(initialData.teamMembers)) {
          setTeamList(initialData.teamMembers);
        } else if (typeof initialData.teamMembers === "string") {
          const parsed = initialData.teamMembers
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean);
          setTeamList(parsed);
        }
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const addTeamMember = () => {
    const raw = teamInput.trim();
    if (!raw) return;

    // Support comma-separated entries e.g. "Alice, Bob, Carol"
    const candidates = raw
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    setTeamList((prev) => {
      const next = [...prev];
      for (const name of candidates) {
        if (!next.includes(name)) {
          next.push(name);
        }
      }
      return next;
    });

    setTeamInput("");
  };

  const removeTeamMember = (name) => {
    setTeamList((l) => l.filter((m) => m !== name));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Hackathon name is required.");
      return;
    }

    // Auto-commit any unsaved text in teamInput
    let finalTeam = [...teamList];
    const pending = teamInput.trim();
    if (pending) {
      const pendingMembers = pending
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m && !finalTeam.includes(m));
      finalTeam = [...finalTeam, ...pendingMembers];
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        platform: form.platform?.trim() || "",
        platformUrl: form.platformUrl?.trim() || "",
        prizePool: form.prizePool?.trim() || "TBA",
        registrationDeadline: form.registrationDeadline || "",
        submissionDeadline: form.submissionDeadline || "",
        teamMembers: finalTeam,
        description: form.description?.trim() || "",
      };

      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save hackathon.");
      }

      const data = await res.json();
      onAdd(data);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isPrefilled =
    initialData &&
    Object.keys(initialData).length > 0 &&
    (initialData.name || initialData.prizePool);

  return (
    <div
      id="add-hackathon-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl shadow-2xl border border-violet-500/25">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-violet-500/20 bg-[#12122a]/95 backdrop-blur-md rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Add New Hackathon</h2>
              {isPrefilled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  <Sparkles className="w-3 h-3" />
                  Auto-filled by AI
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter hackathon platform, deadlines, prizes, and team members
            </p>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Main Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hackathon Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Hackathon Name <span className="text-pink-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Trophy className="w-4 h-4 text-yellow-400/80" />
                </div>
                <input
                  id="field-name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. HackMIT 2026, ETHGlobal San Francisco"
                  className="dark-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Hosting Platform / Site */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Hosting Platform / Site
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Globe className="w-4 h-4 text-violet-400/80" />
                </div>
                <input
                  id="field-platform"
                  name="platform"
                  type="text"
                  value={form.platform}
                  onChange={handleChange}
                  placeholder="e.g. Devpost, Devfolio, Unstop"
                  className="dark-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Platform URL */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Platform / Hackathon URL
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="field-platformUrl"
                  name="platformUrl"
                  type="url"
                  value={form.platformUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="dark-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Prize Pool */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Prize Pool
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  id="field-prizePool"
                  name="prizePool"
                  type="text"
                  value={form.prizePool}
                  onChange={handleChange}
                  placeholder="e.g. $50,000, 10,000 USD, or Swag & Mentorship"
                  className="dark-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Registration Deadline */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                🔔 Registration Deadline
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Calendar className="w-4 h-4 text-violet-400" />
                </div>
                <input
                  id="field-registrationDeadline"
                  name="registrationDeadline"
                  type="date"
                  value={form.registrationDeadline}
                  onChange={handleChange}
                  className="dark-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Project Submission Deadline */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                📤 Project Submission Deadline
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <FileText className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  id="field-submissionDeadline"
                  name="submissionDeadline"
                  type="date"
                  value={form.submissionDeadline}
                  onChange={handleChange}
                  className="dark-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20">
            <label className="block text-sm font-semibold text-white mb-1.5">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-violet-400" />
                Team Members
              </span>
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Add your teammates. Type names separated by commas or press Enter.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                id="team-member-input"
                type="text"
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTeamMember();
                  }
                }}
                placeholder="e.g. Priya S., Vikram T."
                className="dark-input flex-1 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                id="add-team-member-btn"
                onClick={addTeamMember}
                className="px-4 py-2 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300 hover:bg-violet-600/50 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {teamList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {teamList.map((member) => (
                  <span
                    key={member}
                    className="team-chip group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-200"
                  >
                    <Users className="w-3 h-3 text-violet-400" />
                    <span>{member}</span>
                    <button
                      type="button"
                      onClick={() => removeTeamMember(member)}
                      className="ml-1 text-violet-400/60 hover:text-pink-400 transition-colors"
                      title="Remove member"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              id="field-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Hackathon tracks, idea brief, project repository link, etc."
              rows={3}
              className="dark-input w-full rounded-lg px-3 py-2.5 text-sm resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              id="cancel-add-btn"
              onClick={onClose}
              className="flex-1 btn-ghost py-3 rounded-xl font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-hackathon-btn"
              disabled={loading}
              className="flex-1 btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Add Hackathon ⚡</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
