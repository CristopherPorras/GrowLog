import { useState } from "react";
import { ShieldCheck, ExternalLink, Pencil, X, Check, Sparkles } from "lucide-react";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { EntryCard } from "./EntryCard";
import { generateBio } from "@/lib/gemini";

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

interface UserProfile {
  username: string;
  display_name: string;
  bio: string;
}

interface PublicProfileProps {
  projects: Project[];
  profile: UserProfile;
  isOwner?: boolean;
  onUpdateProfile?: (updates: { display_name?: string; bio?: string }) => Promise<void>;
}

function isLocked(dateStr: string): boolean {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return dateStr.slice(0, 10) !== today;
}

export function PublicProfile({ projects, profile, isOwner = false, onUpdateProfile }: PublicProfileProps) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);

  const totalDays = new Set(projects.flatMap((p) => p.entries.map((e) => e.date.slice(0, 10)))).size;
  const verifiedEntries = projects.flatMap((p) => p.entries).filter((e) => isLocked(e.date)).length;
  const allEntries = projects.flatMap((p) => p.entries);
  const totalEntries = allEntries.length;

  // Compute streak
  const streak = (() => {
    const days = [...new Set(allEntries.map((e) => e.date.slice(0, 10)))].sort().reverse();
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

  // Compute achievements
  const achievements = [
    totalEntries >= 1 && { emoji: "✍️", label: "Primer registro", desc: "Escribiste tu primera bitácora" },
    totalEntries >= 10 && { emoji: "📖", label: "Estudiante", desc: "10 entradas escritas" },
    totalEntries >= 50 && { emoji: "📚", label: "Prolífico", desc: "50 entradas escritas" },
    totalEntries >= 100 && { emoji: "💯", label: "Centenario", desc: "100 entradas escritas" },
    streak >= 7 && { emoji: "🔥", label: "Racha semanal", desc: "7 días consecutivos" },
    streak >= 14 && { emoji: "⚡", label: "Racha épica", desc: "14 días consecutivos" },
    streak >= 30 && { emoji: "🏆", label: "Imparable", desc: "30 días consecutivos" },
    projects.some((p) => new Set(p.entries.map((e) => e.date.slice(0, 10))).size >= p.goal_days) && { emoji: "🎯", label: "Meta cumplida", desc: "Completaste la meta de un proyecto" },
  ].filter(Boolean) as { emoji: string; label: string; desc: string }[];

  const handleSave = async () => {
    if (!onUpdateProfile) return;
    setSaving(true);
    await onUpdateProfile({ display_name: displayName.trim(), bio: bio.trim() });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDisplayName(profile.display_name);
    setBio(profile.bio ?? "");
    setEditing(false);
  };

  const handleGenerateBio = async (autoSave = false) => {
    if (generatingBio || projects.length === 0) return;
    setGeneratingBio(true);
    try {
      const summary = projects
        .map((p) => {
          const entries = p.entries.map((e) => e.text.slice(0, 200)).join("\n");
          return `Proyecto: ${p.name}\nEntradas:\n${entries}`;
        })
        .join("\n\n");
      const generated = await generateBio(summary);
      setBio(generated);
      if (autoSave && onUpdateProfile) {
        await onUpdateProfile({ bio: generated });
      }
    } catch {
      // silently fail, user can retry
    } finally {
      setGeneratingBio(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto text-2xl font-bold text-primary-foreground select-none">
          {(profile.display_name?.[0] ?? "?").toUpperCase()}
        </div>

        {editing ? (
          <div className="space-y-3 max-w-sm mx-auto text-left">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Tu nombre"
                maxLength={60}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bio</label>
                <button
                  type="button"
                  onClick={handleGenerateBio}
                  disabled={generatingBio || projects.length === 0}
                  className="flex items-center gap-1 text-[11px] text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {generatingBio ? (
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                  )}
                  Generar con IA
                </button>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Cuéntale al mundo en qué estás trabajando..."
                maxLength={200}
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">{bio.length}/200</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !displayName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium transition-all hover:scale-[1.02]"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {profile.display_name}
              </h1>
              {isOwner && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  title="Editar perfil"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
            {profile.bio ? (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{profile.bio}</p>
                {isOwner && (
                  <button
                    onClick={() => handleGenerateBio(true)}
                    disabled={generatingBio || projects.length === 0}
                    className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors mx-auto disabled:opacity-50"
                  >
                    {generatingBio ? (
                      <div className="w-2.5 h-2.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
                    )}
                    Regenerar con IA
                  </button>
                )}
              </div>
            ) : isOwner ? (
              <div className="flex flex-col items-center gap-1.5 mt-3">
                <button
                  onClick={() => handleGenerateBio(true)}
                  disabled={generatingBio || projects.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {generatingBio ? (
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                  )}
                  {generatingBio ? "Generando bio..." : "✨ Generar bio con IA"}
                </button>
                <button onClick={() => setEditing(true)} className="text-[10px] text-muted-foreground hover:underline">
                  o escríbela tú mismo
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-center gap-6 pt-2">
          {[
            { value: projects.length, label: "Espacios" },
            { value: totalDays, label: "Días" },
            { value: verifiedEntries, label: "Verificados", color: true },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-lg font-semibold tabular-nums ${s.color ? "text-success" : "text-foreground"}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <ActivityHeatmap entries={allEntries} />
      </div>

      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-success/10 border border-success/20">
        <ShieldCheck className="w-4 h-4 text-success" strokeWidth={2} />
        <span className="text-xs font-medium text-success">
          {verifiedEntries} registros verificados — Las entradas se bloquean automáticamente después de medianoche
        </span>
      </div>

      {achievements.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Logros</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {achievements.map((a) => (
              <div key={a.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card border border-border shadow-card text-center">
                <span className="text-2xl">{a.emoji}</span>
                <p className="text-[11px] font-semibold text-foreground leading-tight">{a.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.map((project) => {
        const lockedEntries = [...project.entries].filter((e) => isLocked(e.date)).sort((a, b) => b.date.localeCompare(a.date));
        if (lockedEntries.length === 0) return null;
        return (
          <div key={project.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{project.emoji}</span>
              <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
              <span className="text-xs text-muted-foreground ml-auto">{lockedEntries.length} registros</span>
            </div>
            {lockedEntries.slice(0, 5).map((entry) => (
              <EntryCard key={entry.id} text={entry.text} date={entry.date} aiTitle={entry.ai_title} tags={entry.tags} />
            ))}
            {lockedEntries.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-2">+ {lockedEntries.length - 5} registros más</p>
            )}
          </div>
        );
      })}

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
