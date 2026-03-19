import { useState, useMemo } from "react";
import { BookOpen, TrendingUp, CalendarDays, Sparkles, Wand2, X, ChevronRight } from "lucide-react";
import type { Project, UserProfile } from "@/hooks/useSupabaseProjects";
import { getToday, calculateStreak } from "@/hooks/useSupabaseProjects";
import { generateWeeklySummary } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface DashboardViewProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  profile?: UserProfile | null;
}

const PHRASES = [
  "El conocimiento es el único tesoro que crece al compartirse.",
  "Cada día de estudio es un paso hacia tu mejor versión.",
  "La constancia vence lo que la dicha no alcanza.",
  "Lo que se documenta, se demuestra.",
  "No hay atajos hacia un lugar que valga la pena ir.",
  "Aprende algo nuevo hoy. Tu futuro yo te lo agradecerá.",
  "La disciplina es elegir entre lo que quieres ahora y lo que más quieres.",
];

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ActivityHeatmap({ projects }: { projects: Project[] }) {
  const entriesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p =>
      p.entries.forEach(e => {
        const date = e.date.slice(0, 10);
        map[date] = (map[date] || 0) + 1;
      })
    );
    return map;
  }, [projects]);

  const today = toLocalDateStr(new Date());
  const WEEKS = 14;

  const start = new Date();
  start.setDate(start.getDate() - WEEKS * 7 + 1);

  const weekCols = useMemo(() => {
    const cols: Array<Array<{ date: string; count: number; isToday: boolean }>> = [];
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const dateStr = toLocalDateStr(date);
        col.push({ date: dateStr, count: entriesByDate[dateStr] || 0, isToday: dateStr === today });
      }
      cols.push(col);
    }
    return cols;
  }, [entriesByDate, today]);

  const totalActive = Object.keys(entriesByDate).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Actividad reciente</p>
        <p className="text-[10px] text-muted-foreground">{totalActive} días con entradas</p>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weekCols.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-1 shrink-0">
            {col.map((cell, di) => (
              <div
                key={di}
                title={`${cell.date}${cell.count > 0 ? ` · ${cell.count} entrada${cell.count !== 1 ? "s" : ""}` : ""}`}
                className={cn(
                  "w-3 h-3 rounded-sm transition-all duration-200 cursor-default",
                  cell.isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-card" : "",
                  cell.count === 0
                    ? "bg-secondary/60 dark:bg-secondary/40"
                    : cell.count === 1
                    ? "bg-primary/45"
                    : "bg-primary"
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-[9px] text-muted-foreground">Menos</span>
        {[0, 0.45, 1].map((o, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: o === 0 ? "hsl(var(--secondary) / 0.6)" : `hsl(var(--primary) / ${o})` }} />
        ))}
        <span className="text-[9px] text-muted-foreground">Más</span>
      </div>
    </div>
  );
}

export function DashboardView({ projects, onSelectProject, onNewProject, profile }: DashboardViewProps) {
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const totalEntries = projects.reduce((s, p) => s + p.entries.length, 0);
  const totalDays = new Set(projects.flatMap(p => p.entries.map(e => e.date.slice(0, 10)))).size;
  const today = getToday();

  // Deterministic phrase per day
  const phrase = PHRASES[Math.floor(Date.now() / 86400000) % PHRASES.length];

  const { current: streak, longest: longestStreak, hasTodayEntry } = calculateStreak(projects);

  // Greeting by time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const displayName = profile?.display_name?.split(" ")[0] || profile?.username || "";

  // Streak color + icon
  const streakColor =
    streak === 0 ? "text-muted-foreground" :
    streak < 7 ? "text-blue-400" :
    streak < 30 ? "text-orange-400" :
    streak < 100 ? "text-red-500" : "text-yellow-400";

  const streakFlame = streak === 0 ? "🌱" : streak < 100 ? "🔥" : "⚡";

  // Adaptive message
  const adaptiveMessage =
    streak === 0 && totalEntries === 0
      ? "Bienvenido. Tu primer paso ya lo diste. Escribe hoy."
      : streak === 0
      ? "Ayer fue difícil, pero hoy es nuevo. Vuelve a comenzar."
      : hasTodayEntry
      ? `¡Racha de ${streak} días activa! Vuelve mañana para no romperla.`
      : `Llevas ${streak} días aprendiendo sin parar. ¡No lo rompas hoy!`;

  // Quick log: open most recently active project
  const handleQuickLog = () => {
    if (projects.length === 0) return onNewProject();
    const sorted = [...projects].sort((a, b) => {
      const aLast = a.entries[a.entries.length - 1]?.date ?? "";
      const bLast = b.entries[b.entries.length - 1]?.date ?? "";
      return bLast.localeCompare(aLast);
    });
    onSelectProject(sorted[0].id);
  };

  // Weekly summary
  const weekStart = getWeekStart();
  const weekEntries = projects.flatMap(p =>
    p.entries
      .filter(e => e.date.slice(0, 10) >= weekStart)
      .map(e => `[${p.name}] ${e.ai_title ? `${e.ai_title}: ` : ""}${e.text.slice(0, 400)}`)
  );

  const handleGenerateWeeklySummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const text = weekEntries.length > 0 ? weekEntries.join("\n\n---\n\n") : "No hay entradas esta semana.";
      const result = await generateWeeklySummary(text);
      setWeeklySummary(result);
    } catch (e: any) {
      setSummaryError(`Error: ${e?.message ?? "desconocido"}`);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Hero Section */}
      <div className="rounded-2xl bg-card border border-border shadow-card p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting}{displayName ? `, ${displayName}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{adaptiveMessage}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Streak counter */}
          <div className="flex items-center gap-3">
            <span className={cn("text-5xl font-bold tabular-nums leading-none", streakColor)}>
              {streak}
            </span>
            <div>
              <span className="text-2xl leading-none">{streakFlame}</span>
              <p className="text-xs text-muted-foreground mt-0.5">días de racha</p>
              {longestStreak > streak && (
                <p className="text-[10px] text-muted-foreground/60">Récord: {longestStreak}</p>
              )}
            </div>
          </div>

          {/* Quick Log CTA */}
          <button
            onClick={handleQuickLog}
            className={cn(
              "px-5 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 shrink-0",
              hasTodayEntry
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "bg-primary text-primary-foreground animate-pulse-soft hover:shadow-xl"
            )}
          >
            {hasTodayEntry ? "✅ Ver entrada" : "+ Escribir hoy"}
          </button>
        </div>

        {/* Day status bar */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <span>{hasTodayEntry ? "✅" : "⏳"}</span>
          <span>{hasTodayEntry ? "Entrada de hoy completada" : "Aún no has escrito hoy"}</span>
          {streak >= 7 && !hasTodayEntry && (
            <span className="ml-auto text-orange-400 font-medium">⚠ Racha en riesgo</span>
          )}
        </div>
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Espacios", value: projects.length, icon: BookOpen },
            { label: "Entradas", value: totalEntries, icon: TrendingUp },
            { label: "Días activos", value: totalDays, icon: CalendarDays },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border shadow-card text-center transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
              <div className="w-7 h-7 rounded-lg bg-mint-soft flex items-center justify-center mx-auto mb-2">
                <stat.icon className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-semibold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16 space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-mint-soft flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-medium text-lg">Empieza tu GrowLog</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">"{phrase}"</p>
          </div>
          <button
            onClick={onNewProject}
            className="mt-3 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] active:scale-[0.98]"
          >
            Crear tu primer espacio
          </button>
        </div>
      ) : (
        <>
          {/* Activity Heatmap */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <ActivityHeatmap projects={projects} />
          </div>

          {/* Projects list */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tus espacios</p>
            {projects.map(project => {
              const uniqueDays = new Set(project.entries.map(e => e.date.slice(0, 10))).size;
              const progress = Math.min(100, Math.round((uniqueDays / project.goal_days) * 100));
              const lastEntry = project.entries[project.entries.length - 1];
              const hasTodayInProject = project.entries.some(e => e.date.slice(0, 10) === today);
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="w-full p-5 rounded-2xl bg-card border border-border shadow-card text-left transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/40 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{project.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{project.name}</p>
                        {hasTodayInProject && (
                          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">hoy ✓</span>
                        )}
                      </div>
                      {lastEntry && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          "{lastEntry.ai_title || lastEntry.text.slice(0, 60)}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-success tabular-nums">{progress}%</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full progress-gradient transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quote */}
          <div className="px-5 py-4 rounded-xl border border-border/50 bg-card/50">
            <p className="text-sm text-muted-foreground italic text-center">"{phrase}"</p>
          </div>

          {/* Weekly AI summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Resumen semanal</p>
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
                    <button onClick={handleGenerateWeeklySummary} disabled={loadingSummary} className="text-[11px] text-primary hover:underline disabled:opacity-50">
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

            {summaryError && <p className="text-xs text-destructive">{summaryError}</p>}
          </div>
        </>
      )}
    </div>
  );
}
