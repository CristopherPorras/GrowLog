import { useState } from "react";
import { BookOpen, TrendingUp, CalendarDays, Sparkles, Bell, Wand2, X } from "lucide-react";
import type { Project } from "@/hooks/useSupabaseProjects";
import { getToday } from "@/hooks/useSupabaseProjects";
import { generateWeeklySummary } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";

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

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DashboardView({ projects, onSelectProject, onNewProject }: DashboardViewProps) {
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [dismissReminder, setDismissReminder] = useState(false);

  const totalEntries = projects.reduce((s, p) => s + p.entries.length, 0);
  const totalDays = new Set(projects.flatMap((p) => p.entries.map((e) => e.date.slice(0, 10)))).size;
  const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
  const today = getToday();

  // Check if user has written today in any project
  const hasTodayEntry = projects.some((p) => p.entries.some((e) => e.date.slice(0, 10) === today));

  // Entries from this week
  const weekStart = getWeekStart();
  const weekEntries = projects.flatMap((p) =>
    p.entries
      .filter((e) => e.date.slice(0, 10) >= weekStart)
      .map((e) => `[${p.name}] ${e.ai_title ? `${e.ai_title}: ` : ""}${e.text.slice(0, 400)}`)
  );

  const handleGenerateWeeklySummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const text = weekEntries.length > 0
        ? weekEntries.join("\n\n---\n\n")
        : "No hay entradas esta semana.";
      const result = await generateWeeklySummary(text);
      setWeeklySummary(result);
    } catch (e: any) {
      setSummaryError(`Error: ${e?.message ?? "desconocido"}`);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Daily reminder banner */}
      {projects.length > 0 && !hasTodayEntry && !dismissReminder && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20">
          <Bell className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-primary font-medium flex-1">
            ¡Aún no has escrito tu bitácora de hoy! Mantén tu racha activa.
          </p>
          <button onClick={() => setDismissReminder(true)} className="text-primary/60 hover:text-primary transition-colors shrink-0">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      )}

      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">GrowLog</h1>
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
            <p className="text-foreground font-medium text-lg">Empieza tu GrowLog</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">"{phrase}"</p>
          </div>
          <button onClick={onNewProject} className="mt-3 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] active:scale-[0.98]">
            Crear tu primer espacio
          </button>
        </div>
      ) : (
        <>
          {/* Projects list */}
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

          {/* Weekly AI summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Resumen semanal
              </p>
              <span className="text-[10px] text-muted-foreground">{weekEntries.length} entradas esta semana</span>
            </div>

            {weeklySummary ? (
              <div className="p-4 rounded-2xl bg-card border border-border shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Generado por IA</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateWeeklySummary}
                      disabled={loadingSummary}
                      className="text-[11px] text-primary hover:underline disabled:opacity-50"
                    >
                      Regenerar
                    </button>
                    <button onClick={() => setWeeklySummary(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                <div className="prose-devlog text-sm">
                  <ReactMarkdown>{weeklySummary}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateWeeklySummary}
                disabled={loadingSummary}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/30 text-sm text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {loadingSummary ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                )}
                {loadingSummary ? "Generando resumen..." : "Generar resumen semanal con IA"}
              </button>
            )}

            {summaryError && (
              <p className="text-xs text-destructive">{summaryError}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
