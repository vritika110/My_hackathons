"use client";
import { useState } from "react";
import {
  Calendar,
  DollarSign,
  Globe,
  Users,
  Trophy,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Clock,
  Trash2,
  AlertTriangle,
  Award,
} from "lucide-react";

function getDaysRemaining(dateStr) {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length < 3 || isNaN(parts[0])) return null;

    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return Math.round((target - today) / (1000 * 60 * 60 * 24));
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
  let bgClass = "bg-emerald-500/20 border-emerald-500/40";
  let text = `${days}d left`;

  if (isPast) {
    colorClass = "text-slate-400";
    bgClass = "bg-slate-700/60 border-slate-600";
    text = "Passed";
  } else if (isToday) {
    colorClass = "text-red-200";
    bgClass = "bg-red-600/30 border-red-500/60";
    text = "Today!";
  } else if (days === 1) {
    colorClass = "text-orange-200";
    bgClass = "bg-orange-600/30 border-orange-500/50";
    text = "Tomorrow!";
  } else if (days <= 3) {
    colorClass = "text-amber-200";
    bgClass = "bg-amber-600/25 border-amber-500/40";
    text = `${days}d left`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${bgClass} ${colorClass} ${
        isUrgent && !isPast ? "animate-pulse" : ""
      }`}
    >
      {isUrgent && !isPast ? (
        <AlertTriangle className="w-3 h-3 text-red-400" />
      ) : (
        <Clock className="w-3 h-3 opacity-80" />
      )}
      <span>{text}</span>
    </span>
  );
}

function formatPrettyDate(dateStr) {
  if (!dateStr) return "TBA / Rolling";
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

  const handleDelete = async () => {
    if (!confirm(`Delete "${hackathon.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/hackathons?id=${hackathon.id}`, { method: "DELETE" });
      onDelete(hackathon.id);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const daysRemaining = getDaysRemaining(hackathon.registrationDeadline);
  const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;

  return (
    <div
      id={`hackathon-card-${hackathon.id}`}
      className={`flex flex-col justify-between rounded-2xl bg-slate-800/90 border transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/60 ${
        isUrgent
          ? "border-red-500/40 hover:border-red-500/70"
          : "border-slate-700/70 hover:border-violet-500/50"
      } p-6`}
    >
      {/* ── TOP ANATOMY: Pill-Shaped Badges ── */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Platform Badge */}
          {hackathon.platform ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-300">
              <Globe className="w-3 h-3 text-violet-400" />
              <span>{hackathon.platform}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-300">
              <Globe className="w-3 h-3 text-violet-400" />
              <span>Hackathon</span>
            </span>
          )}

          {/* Difficulty / Category Pill */}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            <Award className="w-3 h-3 text-cyan-400" />
            <span>Open Track</span>
          </span>

          {/* Prize Pool Pill Badge */}
          {hackathon.prizePool && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 ml-auto">
              <DollarSign className="w-3 h-3 text-amber-400" />
              <span>{hackathon.prizePool}</span>
            </span>
          )}
        </div>

        {/* ── MIDDLE ANATOMY: Bold Name/Title & Short Description ── */}
        <div className="mb-6">
          <div className="flex items-start gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
              {hackathon.name}
            </h3>
          </div>

          <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {hackathon.description ||
              "Explore project tracks, connect with team members, and compete for prize pools."}
          </p>
        </div>
      </div>

      {/* ── BOTTOM ANATOMY: Highly Visible Deadline, Team Members, View Details ── */}
      <div className="space-y-4 pt-4 border-t border-slate-700/60">
        {/* Highly Visible Registration Deadline */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isUrgent
              ? "bg-red-950/30 border-red-500/40"
              : "bg-slate-900/90 border-slate-700/80"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p
                className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${
                  isUrgent ? "text-red-400" : "text-violet-400"
                }`}
              >
                🔔 Registration Deadline
              </p>
              <p className="text-lg font-black text-white tracking-tight">
                {formatPrettyDate(hackathon.registrationDeadline)}
              </p>
            </div>
            <DaysLeftBadge dateStr={hackathon.registrationDeadline} />
          </div>
        </div>

        {/* Team Members */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span>Team Members ({hackathon.teamMembers?.length || 0})</span>
          </p>

          <div className="flex flex-wrap gap-1.5">
            {hackathon.teamMembers && hackathon.teamMembers.length > 0 ? (
              hackathon.teamMembers.map((member, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/80 border border-slate-600/70 text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span>{member}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">
                Solo / No teammates assigned
              </span>
            )}
          </div>
        </div>

        {/* Action Bar: 'View Details >' Link & Delete Action */}
        <div className="flex items-center justify-between pt-2">
          <button
            id={`expand-btn-${hackathon.id}`}
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <span>{expanded ? "Hide Details ∧" : "View Details >"}</span>
          </button>

          <button
            id={`delete-btn-${hackathon.id}`}
            onClick={handleDelete}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 cursor-pointer"
            title="Delete hackathon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* ── EXPANDED DETAILS (When 'View Details >' is toggled) ── */}
        {expanded && (
          <div className="mt-3 pt-4 border-t border-slate-700/50 space-y-3">
            {/* Project Submission Deadline */}
            {hackathon.submissionDeadline && (
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/25 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold mb-0.5">
                    📤 Submission Deadline
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatPrettyDate(hackathon.submissionDeadline)}
                  </p>
                </div>
                <DaysLeftBadge dateStr={hackathon.submissionDeadline} />
              </div>
            )}

            {/* Full description */}
            {hackathon.description && (
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Full Details & Tracks
                </p>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {hackathon.description}
                </p>
              </div>
            )}

            {/* Platform URL link */}
            {hackathon.platformUrl && (
              <a
                href={hackathon.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 text-xs font-semibold transition-colors"
              >
                <span>Visit Hackathon Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
