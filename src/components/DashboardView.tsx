import { BookOpen, TrendingUp, CalendarDays, Sparkles } from "lucide-react";
import type { Project } from "@/hooks/useSupabaseProjects";

interface DashboardViewProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

const PHRASES = [
  "El conocimiento es el único tesoro que crece al compartirse.",
  "Cada día de estudio es un paso hacia tu mejor versión.",
  "La constancia vence lo que la dicha no alcanza.",
  "Lo que se documenta, se demuestra.",
];

export function DashboardView({ projects, onSelectProject, onNewProject }: DashboardViewProps) {
  const totalEntries = projects.reduce((s, p) => s + p.entries.length, 0);
  const totalDays = new Set(projects.flatMap((p) => p.entries.map((e) => e.date.slice(0, 10)))).size;
  const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">DevLog & Learn</h1>
        <p className="text-muted-foreground text-sm">Documenta tu aprendizaje. Demuestra tu constancia.</p>
      </div>

      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Espacios", value: projects.length, icon: BookOpen },
            { label: "Entradas", value: totalEntries, icon: TrendingUp },
            { label: "Días activos", value: totalDays, icon: CalendarDays },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl bg-card border border-border shadow-card text-center transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-lg bg-mint-soft flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-4 h-4 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-mint-soft flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-medium text-lg">Empieza tu DevLog</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">"{phrase}"</p>
          </div>
          <button onClick={onNewProject} className="mt-3 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] active:scale-[0.98]">
            Crear tu primer espacio
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tus espacios</p>
          {projects.map((project) => {
            const uniqueDays = new Set(project.entries.map((e) => e.date.slice(0, 10))).size;
            const progress = Math.min(100, Math.round((uniqueDays / project.goal_days) * 100));
            const lastEntry = project.entries[project.entries.length - 1];
            return (
              <button key={project.id} onClick={() => onSelectProject(project.id)} className="w-full p-5 rounded-2xl bg-card border border-border shadow-card text-left transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/40 group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{project.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{project.name}</p>
                    {lastEntry && <p className="text-xs text-muted-foreground mt-0.5 truncate">Última: "{lastEntry.text.slice(0, 60)}"</p>}
                  </div>
                  <span className="text-sm font-semibold text-success tabular-nums">{progress}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full progress-gradient transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
