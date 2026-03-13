import { ShieldCheck, ExternalLink, Code2 } from "lucide-react";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { EntryCard } from "./EntryCard";

interface Entry {
  id: string;
  text: string;
  date: string;
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
}

function isLocked(dateStr: string): boolean {
  return dateStr.slice(0, 10) !== new Date().toISOString().slice(0, 10);
}

export function PublicProfile({ projects, profile }: PublicProfileProps) {
  const totalEntries = projects.reduce((s, p) => s + p.entries.length, 0);
  const totalDays = new Set(projects.flatMap((p) => p.entries.map((e) => e.date.slice(0, 10)))).size;
  const verifiedEntries = projects.flatMap((p) => p.entries).filter((e) => isLocked(e.date)).length;
  const allEntries = projects.flatMap((p) => p.entries);

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <Code2 className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {profile.display_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{profile.bio}</p>
        </div>

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
              <EntryCard key={entry.id} text={entry.text} date={entry.date} />
            ))}
            {lockedEntries.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-2">+ {lockedEntries.length - 5} registros más</p>
            )}
          </div>
        );
      })}

      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
          Comparte este perfil en tu LinkedIn o CV
        </p>
      </div>
    </div>
  );
}
