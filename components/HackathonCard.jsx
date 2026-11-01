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
} from "lucide-react";
import { formatDistanceToNow, differenceInDays, parseISO, isValid } from "date-fns";

function DaysLeft({ dateStr, label }) {
  if (!dateStr) return null;

  let date;
  try {
    date = parseISO(dateStr);
    if (!isValid(date)) return null;
  } catch {
    return null;
  }

  const days = differenceInDays(date, new Date());
  const isPast = days < 0;
  const isToday = days === 0;
  const isUrgent = days >= 0 && days <= 3;

  let colorClass = "deadline-safe";
  let bgClass = "bg-emerald-500/10 border-emerald-500/25";
  if (isPast) {
    colorClass = "text-slate-500";
    bgClass = "bg-slate-500/10 border-slate-500/20";
  } else if (isToday || days <= 1) {
    colorClass = "deadline-critical";
    bgClass = "bg-red-500/15 border-red-500/30";
  } else if (days <= 3) {
    colorClass = "deadline-warning";
    bgClass = "bg-orange-500/10 border-orange-500/25";
  } else if (days <= 7) {
    colorClass = "deadline-caution";
    bgClass = "bg-yellow-500/10 border-yellow-500/20";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${bgClass} ${colorClass} ${isUrgent && !isPast ? "urgent-glow" : ""}`}
    >
      {isUrgent && !isPast && <AlertTriangle className="w-3 h-3" />}
      <Clock className="w-3 h-3" />
      {isPast
        ? "Passed"
        : isToday
        ? "Today!"
        : `${days}d left`}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "TBA";
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function HackathonCard({ hackathon, onDelete, index = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const delayClass = `fade-in-up-delay-${Math.min(index + 1, 6)}`;

  const handleDelete = async () => {
    if (!confirm(`Delete "${hackathon.name}"? This cannot be undone.`)) return;
    await fetch(`/api/hackathons?id=${hackathon.id}`, { method: "DELETE" });
    onDelete(hackathon.id);
  };

  return (
    <div
      id={`hackathon-card-${hackathon.id}`}
      className={`glass-card rounded-2xl overflow-hidden fade-in-up ${delayClass}`}
    >
      {/* Accent line */}
      <div className="card-accent-line" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <h3 className="text-base font-bold text-white truncate">
                {hackathon.name}
              </h3>
            </div>
            {hackathon.platform && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Globe className="w-3 h-3" />
                {hackathon.platformUrl ? (
                  <a
                    href={hackathon.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-violet-400 transition-colors flex items-center gap-1"
                  >
                    {hackathon.platform}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  hackathon.platform
                )}
              </div>
            )}
          </div>

          {/* Prize Pool badge */}
          {hackathon.prizePool && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 text-xs font-bold">
              <DollarSign className="w-3.5 h-3.5" />
              {hackathon.prizePool}
            </div>
          )}
        </div>

        {/* ─────────── PROMINENT SECTION ─────────── */}
        {/* Registration Deadline — most prominent */}
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-violet-900/30 to-pink-900/20 border border-violet-500/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold mb-1">
                🔔 Registration Deadline
              </p>
              <p className="text-xl font-black text-white">
                {formatDate(hackathon.registrationDeadline)}
              </p>
            </div>
            <DaysLeft dateStr={hackathon.registrationDeadline} />
          </div>
        </div>

        {/* Team Members — second most prominent */}
        {hackathon.teamMembers && hackathon.teamMembers.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Team ({hackathon.teamMembers.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {hackathon.teamMembers.map((member) => (
                <span key={member} className="team-chip text-sm font-semibold">
                  <Users className="w-3 h-3" />
                  {member}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 mt-4">
          <button
            id={`expand-btn-${hackathon.id}`}
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg btn-ghost text-sm font-medium"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View Full Info
              </>
            )}
          </button>
          <button
            id={`delete-btn-${hackathon.id}`}
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
            title="Delete hackathon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-violet-500/10 space-y-3 fade-in-up">
            {/* Submission deadline */}
            {hackathon.submissionDeadline && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/20">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold mb-0.5">
                    📤 Submission Deadline
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatDate(hackathon.submissionDeadline)}
                  </p>
                </div>
                <DaysLeft dateStr={hackathon.submissionDeadline} />
              </div>
            )}

            {/* Description */}
            {hackathon.description && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                  About
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {hackathon.description}
                </p>
              </div>
            )}

            {/* Added date */}
            {hackathon.createdAt && (
              <p className="text-xs text-slate-600">
                Added{" "}
                {formatDistanceToNow(new Date(hackathon.createdAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
