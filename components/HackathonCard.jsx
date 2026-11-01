"use client";
import { useState } from "react";
import {
  Calendar,
  DollarSign,
  Globe,
  Users,
  Trophy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

function getDaysRemaining(dateStr) {
  if (!dateStr) return null;
  try {
    // Parse target date and compare midnight-to-midnight to avoid timezone jitter
    const parts = dateStr.split("-").map(Number);
    if (parts.length < 3 || isNaN(parts[0])) return null;

    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

function DaysLeftBadge({ dateStr }) {
  const days = getDaysRemaining(dateStr);
  if (days === null) return null;

  const isPast = days < 0;
  const isToday = days === 0;
  const isUrgent = days >= 0 && days <= 3;

  let colorClass = "text-emerald-300";
  let bgClass = "bg-emerald-500/15 border-emerald-500/30";
  let text = `${days}d left`;

  if (isPast) {
    colorClass = "text-slate-400";
    bgClass = "bg-slate-800/80 border-slate-700";
    text = "Ended";
  } else if (isToday) {
    colorClass = "text-red-300";
    bgClass = "bg-red-500/25 border-red-500/50";
    text = "Today!";
  } else if (days === 1) {
    colorClass = "text-orange-300";
    bgClass = "bg-orange-500/20 border-orange-500/40";
    text = "Tomorrow!";
  } else if (days <= 3) {
    colorClass = "text-amber-300";
    bgClass = "bg-amber-500/20 border-amber-500/35";
    text = `${days} days left`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wide shadow-sm ${bgClass} ${colorClass} ${
        isUrgent && !isPast ? "animate-pulse shadow-red-500/20" : ""
      }`}
    >
      {isUrgent && !isPast ? (
        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
      ) : (
        <Clock className="w-3.5 h-3.5 opacity-80" />
      )}
      <span>{text}</span>
    </span>
  );
}

function formatPrettyDate(dateStr) {
  if (!dateStr) return "TBA / Open";
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length >= 3 && !isNaN(parts[0])) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export default function HackathonCard({ hackathon, onDelete, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const delayClass = `fade-in-up-delay-${Math.min(index + 1, 6)}`;

  const handleDelete = async () => {
    if (!confirm(`Delete "${hackathon.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/hackathons?id=${hackathon.id}`, { method: "DELETE" });
      onDelete(hackathon.id);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const daysUntilReg = getDaysRemaining(hackathon.registrationDeadline);
  const isUrgent = daysUntilReg !== null && daysUntilReg >= 0 && daysUntilReg <= 3;

  return (
    <div
      id={`hackathon-card-${hackathon.id}`}
      className={`glass-card rounded-2xl overflow-hidden fade-in-up transition-all duration-300 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/30 ${
        isUrgent ? "border-red-500/30 shadow-red-950/20" : "border-violet-500/20"
      } ${delayClass}`}
    >
      {/* Top Accent line */}
      <div
        className={`h-1 w-full bg-gradient-to-r ${
          isUrgent
            ? "from-red-500 via-orange-500 to-amber-500"
            : "from-violet-500 via-fuchsia-500 to-pink-500"
        }`}
      />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Header row: Title, Platform & Prize */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white truncate tracking-tight">
                {hackathon.name}
              </h3>
            </div>
            {hackathon.platform && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Globe className="w-3.5 h-3.5 text-violet-400/80" />
                {hackathon.platformUrl ? (
                  <a
                    href={hackathon.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-violet-300 transition-colors flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                  >
                    <span>{hackathon.platform}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                ) : (
                  <span>{hackathon.platform}</span>
                )}
              </div>
            )}
          </div>

          {/* Prize Pool Badge */}
          {hackathon.prizePool && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 text-amber-300 text-xs font-extrabold shadow-sm">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>{hackathon.prizePool}</span>
            </div>
          )}
        </div>

        {/* ─────────── HIGHLY VISIBLE REGISTRATION DEADLINE ─────────── */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            isUrgent
              ? "bg-gradient-to-br from-red-950/40 via-red-900/20 to-purple-950/30 border-red-500/35 shadow-inner"
              : "bg-gradient-to-br from-violet-950/40 via-purple-900/20 to-pink-950/20 border-violet-500/30 shadow-inner"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p
                className={`text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                  isUrgent ? "text-red-400" : "text-violet-300"
                }`}
              >
                <span>🔔 Registration Deadline</span>
                {isUrgent && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/30 text-red-200">
                    URGENT
                  </span>
                )}
              </p>
              <p className="text-2xl font-black text-white tracking-tight">
                {formatPrettyDate(hackathon.registrationDeadline)}
              </p>
            </div>
            <DaysLeftBadge dateStr={hackathon.registrationDeadline} />
          </div>
        </div>

        {/* ─────────── HIGHLY VISIBLE TEAM MEMBERS ─────────── */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span>Team Members</span>
              {hackathon.teamMembers?.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 border border-violet-500/40 text-violet-300">
                  {hackathon.teamMembers.length}
                </span>
              )}
            </p>
          </div>

          {hackathon.teamMembers && hackathon.teamMembers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hackathon.teamMembers.map((member, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 border border-violet-500/35 text-violet-200 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  <span>{member}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Solo / No teammates assigned yet
            </p>
          )}
        </div>

        {/* ─────────── ACTION BAR (View Full Info + Delete) ─────────── */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            id={`expand-btn-${hackathon.id}`}
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl btn-ghost text-xs font-semibold hover:border-violet-500/30 transition-all text-slate-200 hover:text-white"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-violet-400" />
                <span>Hide Full Info</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-violet-400" />
                <span>View Full Info</span>
              </>
            )}
          </button>
          <button
            id={`delete-btn-${hackathon.id}`}
            onClick={handleDelete}
            className="p-2.5 rounded-xl hover:bg-red-500/15 border border-transparent hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-all"
            title="Delete hackathon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* ─────────── EXPANDED FULL INFO DRAWER ─────────── */}
        {expanded && (
          <div className="mt-3 pt-4 border-t border-violet-500/15 space-y-3.5 fade-in-up">
            {/* Project Submission Deadline */}
            {hackathon.submissionDeadline && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/25">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold mb-0.5">
                    📤 Project Submission Deadline
                  </p>
                  <p className="text-base font-bold text-white">
                    {formatPrettyDate(hackathon.submissionDeadline)}
                  </p>
                </div>
                <DaysLeftBadge dateStr={hackathon.submissionDeadline} />
              </div>
            )}

            {/* Description / Notes */}
            {hackathon.description && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  About & Notes
                </p>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {hackathon.description}
                </p>
              </div>
            )}

            {/* External Platform Link */}
            {hackathon.platformUrl && (
              <a
                href={hackathon.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 text-xs font-semibold transition-colors"
              >
                <span>Open Hackathon Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Added Metadata */}
            {hackathon.createdAt && (
              <p className="text-[11px] text-slate-600 text-right">
                Added on{" "}
                {new Date(hackathon.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
