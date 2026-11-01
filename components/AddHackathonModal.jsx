"use client";
import { useState } from "react";
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
  const [teamList, setTeamList] = useState(
    Array.isArray(initialData.teamMembers)
      ? initialData.teamMembers
      : initialData.teamMembers
      ? initialData.teamMembers.split(",").map((m) => m.trim()).filter(Boolean)
      : []
  );

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const addTeamMember = () => {
    const trimmed = teamInput.trim();
    if (trimmed && !teamList.includes(trimmed)) {
      setTeamList((l) => [...l, trimmed]);
      setTeamInput("");
    }
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
    setLoading(true);
    try {
      const payload = {
        ...form,
        teamMembers: teamList,
      };
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save hackathon.");
      const data = await res.json();
      onAdd(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "name",
      label: "Hackathon Name",
      placeholder: "e.g. HackMIT 2025",
      icon: Trophy,
      required: true,
    },
    {
      name: "platform",
      label: "Hosting Platform / Site",
      placeholder: "e.g. Devpost, Unstoppable Domains",
      icon: Globe,
    },
    {
      name: "platformUrl",
      label: "Platform URL",
      placeholder: "https://hackathon.devpost.com",
      icon: ExternalLink,
      type: "url",
    },
    {
      name: "prizePool",
      label: "Prize Pool",
      placeholder: "e.g. $50,000",
      icon: DollarSign,
    },
    {
      name: "registrationDeadline",
      label: "Registration Deadline",
      placeholder: "",
      icon: Calendar,
      type: "date",
    },
    {
      name: "submissionDeadline",
      label: "Project Submission Deadline",
      placeholder: "",
      icon: FileText,
      type: "date",
    },
  ];

  return (
    <div
      id="add-hackathon-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-violet-500/20 bg-[#12122a]/95 backdrop-blur-sm rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">Add New Hackathon</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill in the details to track this hackathon
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
          {/* Standard fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ name, label, placeholder, icon: Icon, type, required }) => (
              <div
                key={name}
                className={name === "name" ? "sm:col-span-2" : ""}
              >
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {label}
                  {required && <span className="text-pink-400 ml-1">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon className="w-4 h-4" />
                  </div>
                  <input
                    id={`field-${name}`}
                    name={name}
                    type={type || "text"}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="dark-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-violet-400" />
                Team Members
              </span>
            </label>
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
                placeholder="Type a name and press Enter..."
                className="dark-input flex-1 rounded-lg px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                id="add-team-member-btn"
                onClick={addTeamMember}
                className="px-4 py-2.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {teamList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {teamList.map((member) => (
                  <span key={member} className="team-chip group">
                    <Users className="w-3 h-3" />
                    {member}
                    <button
                      type="button"
                      onClick={() => removeTeamMember(member)}
                      className="ml-1 text-violet-400/60 group-hover:text-pink-400 transition-colors"
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
              Description
            </label>
            <textarea
              id="field-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of the hackathon (optional)..."
              rows={3}
              className="dark-input w-full rounded-lg px-3 py-2.5 text-sm resize-none"
            />
          </div>

          {/* Error */}
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
              className="flex-1 btn-primary py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
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
