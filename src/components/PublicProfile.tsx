import { useState } from "react";
import { ShieldCheck, ExternalLink, Sparkles, Settings, MapPin, Link2, Briefcase, Github, Linkedin, Twitter } from "lucide-react";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { EntryCard } from "./EntryCard";
import { generateBio } from "@/lib/gemini";
import type { UserProfile } from "@/hooks/useSupabaseProjects";

interface Entry {
  id: string;
  text: string;
  date: string;
  ai_title?: string;
  tags?: string[];
}

interface Project {
  id: string;
  name: string;
  emoji: string;
  goal_days: number;
  entries: Entry[];
}

interface PublicProfileProps {
  projects: Project[];
  profile: UserProfile;
  isOwner?: boolean;
  onUpdateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
  onOpenSettings?: () => void;
}

function isLocked(dateStr: string): boolean {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return dateStr.slice(0, 10) !== today;
}

export function PublicProfile({ projects, profile, isOwner = false, onUpdateProfile, onOpenSettings }: PublicProfileProps) {
  const [generatingBio, setGeneratingBio] = useState(false);

  const totalDays = new Set(projects.flatMap(p => p.entries.map(e => e.date.slice(0, 10)))).size;
  const verifiedEntries = projects.flatMap(p => p.entries).filter(e => isLocked(e.date)).length;
  const allEntries = projects.flatMap(p => p.entries);
  const totalEntries = allEntries.length;

  const streak = (() => {
    const days = [...new Set(allEntries.map(e => e.date.slice(0, 10)))].sort().reverse();
    if (days.length === 0) return 0;
    let count = 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    let current = new Date();
    if (days[0] !== todayStr) current.setDate(current.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      if (days.includes(key)) { count++; current.setDate(current.getDate() - 1); }
      else break;
    }
    return count;
  })();

  const achievements = [
    totalEntries >= 1  && { emoji: "✍️", label: "Primer registro", desc: "Escribiste tu primera bitácora" },
    totalEntries >= 10 && { emoji: "📖", label: "Estudiante",      desc: "10 entradas escritas" },
    totalEntries >= 50 && { emoji: "📚", label: "Prolífico",       desc: "50 entradas escritas" },
    totalEntries >= 100 && { emoji: "💯", label: "Centenario",     desc: "100 entradas escritas" },
    streak >= 7  && { emoji: "🔥", label: "Racha semanal", desc: "7 días consecutivos" },
    streak >= 14 && { emoji: "⚡", label: "Racha épica",   desc: "14 días consecutivos" },
    streak >= 30 && { emoji: "🏆", label: "Imparable",     desc: "30 días consecutivos" },
    projects.some(p => new Set(p.entries.map(e => e.date.slice(0, 10))).size >= p.goal_days) &&
      { emoji: "🎯", label: "Meta cumplida", desc: "Completaste la meta de un proyecto" },
  ].filter(Boolean) as { emoji: string; label: string; desc: string }[];

  const handleGenerateBio = async (autoSave = false) => {
    if (generatingBio || projects.length === 0) return;
    setGeneratingBio(true);
    try {
      const summary = projects.map(p => {
        const entries = p.entries.map(e => e.text.slice(0, 200)).join("\n");
        return `Proyecto: ${p.name}\nEntradas:\n${entries}`;
      }).join("\n\n");
      const generated = await generateBio(summary);
      if (autoSave && onUpdateProfile) {
        await onUpdateProfile({ bio: generated });
      }
    } catch {
      // silent fail
    } finally {
      setGeneratingBio(false);
    }
  };

  const websiteHostname = (() => {
    if (!profile.website) return null;
    try { return new URL(profile.website).hostname; } catch { return profile.website; }
  })();

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Profile Header ── */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-5">

        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white select-none shadow-card overflow-hidden"
            style={{ background: profile.avatar_image ? undefined : (profile.avatar_color ?? "#22c55e") }}
          >
            {profile.avatar_image
              ? <img src={profile.avatar_image} alt="avatar" className="w-full h-full object-cover" />
              : (profile.display_name?.[0] ?? profile.username?.[0] ?? "?").toUpperCase()
            }
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          {/* Role */}
          {profile.role && (
            <div className="flex items-center gap-1.5 text-sm text-foreground/80">
              <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              {profile.role}
            </div>
          )}

          {/* Location + Website */}
          {(profile.location || profile.website) && (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {profile.location && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {websiteHostname}
                </a>
              )}
            </div>
          )}

          {/* Social links */}
          {(profile.github || profile.linkedin || profile.twitter) && (
            <div className="flex items-center gap-2">
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`GitHub: ${profile.github}`}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                >
                  <Github className="w-4 h-4" strokeWidth={1.5} />
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={`https://linkedin.com/in/${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`LinkedIn: ${profile.linkedin}`}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                >
                  <Linkedin className="w-4 h-4" strokeWidth={1.5} />
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`@${profile.twitter}`}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                >
                  <Twitter className="w-4 h-4" strokeWidth={1.5} />
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio ? (
            <div className="max-w-md">
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              {isOwner && (
                <button
                  onClick={() => handleGenerateBio(true)}
                  disabled={generatingBio || projects.length === 0}
                  className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors mx-auto disabled:opacity-50"
                >
                  {generatingBio
                    ? <div className="w-2.5 h-2.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    : <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />}
                  Regenerar bio con IA
                </button>
              )}
            </div>
          ) : isOwner ? (
            <button
              onClick={() => handleGenerateBio(true)}
              disabled={generatingBio || projects.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {generatingBio
                ? <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                : <Sparkles className="w-3 h-3" strokeWidth={1.5} />}
              {generatingBio ? "Generando bio..." : "✨ Generar bio con IA"}
            </button>
          ) : null}

          {/* Edit button for owner */}
          {isOwner && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium hover:text-foreground hover:bg-secondary/80 transition-all"
            >
              <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
              Editar perfil en Configuración
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 pt-3 border-t border-border/50">
          {[
            { value: projects.length, label: "Espacios" },
            { value: totalEntries, label: "Entradas" },
            { value: totalDays, label: "Días" },
            { value: verifiedEntries, label: "Verificados", color: true },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-lg font-semibold tabular-nums ${s.color ? "text-success" : "text-foreground"}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <ActivityHeatmap entries={allEntries} />
      </div>

      {/* Verified banner */}
      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-success/10 border border-success/20">
        <ShieldCheck className="w-4 h-4 text-success" strokeWidth={2} />
        <span className="text-xs font-medium text-success">
          {verifiedEntries} registros verificados — Las entradas se bloquean automáticamente después de medianoche
        </span>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Logros</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {achievements.map(a => (
              <div key={a.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card border border-border shadow-card text-center">
                <span className="text-2xl">{a.emoji}</span>
                <p className="text-[11px] font-semibold text-foreground leading-tight">{a.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects / entries */}
      {projects.map(project => {
        const lockedEntries = [...project.entries]
          .filter(e => isLocked(e.date))
          .sort((a, b) => b.date.localeCompare(a.date));
        if (lockedEntries.length === 0) return null;
        return (
          <div key={project.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{project.emoji}</span>
              <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
              <span className="text-xs text-muted-foreground ml-auto">{lockedEntries.length} registros</span>
            </div>
            {lockedEntries.slice(0, 5).map(entry => (
              <EntryCard key={entry.id} text={entry.text} date={entry.date} aiTitle={entry.ai_title} tags={entry.tags} />
            ))}
            {lockedEntries.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-2">+ {lockedEntries.length - 5} registros más</p>
            )}
          </div>
        );
      })}

      {/* Share link */}
      {!isOwner && (
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            Comparte este perfil en tu LinkedIn o CV
          </p>
        </div>
      )}
      {isOwner && (
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground mb-2">Tu perfil público:</p>
          <code className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-foreground">
            {window.location.origin}/u/{profile.username}
          </code>
        </div>
      )}
    </div>
  );
}
