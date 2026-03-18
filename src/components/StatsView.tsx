import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Flame, CalendarDays, FileText, TrendingUp } from "lucide-react";
import type { Project } from "@/hooks/useSupabaseProjects";
import { getToday } from "@/hooks/useSupabaseProjects";

interface StatsViewProps {
  projects: Project[];
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getWeekLabel(weekStart: Date): string {
  return `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
}

export function StatsView({ projects }: StatsViewProps) {
  const allEntries = projects.flatMap((p) => p.entries);

  // Key metrics
  const totalEntries = allEntries.length;
  const totalDays = new Set(allEntries.map((e) => e.date.slice(0, 10))).size;

  const { currentStreak, longestStreak } = useMemo(() => {
    const days = [...new Set(allEntries.map((e) => e.date.slice(0, 10)))].sort().reverse();
    if (days.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const today = getToday();
    let current = 0;
    let longest = 0;
    let streak = 0;
    let prev: Date | null = null;

    // Current streak
    const d = new Date();
    if (days[0] !== today) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (days.includes(key)) { current++; d.setDate(d.getDate() - 1); }
      else break;
    }

    // Longest streak
    for (const dayStr of [...days].reverse()) {
      const date = new Date(dayStr + "T12:00:00");
      if (prev) {
        const diff = (date.getTime() - prev.getTime()) / 86400000;
        streak = diff === 1 ? streak + 1 : 1;
      } else {
        streak = 1;
      }
      if (streak > longest) longest = streak;
      prev = date;
    }

    return { currentStreak: current, longestStreak: longest };
  }, [allEntries]);

  // Weekly activity (last 12 weeks)
  const weeklyData = useMemo(() => {
    const weeks: { label: string; entries: number }[] = [];
    const now = new Date();
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const startStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
      const endStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, "0")}-${String(weekEnd.getDate()).padStart(2, "0")}`;
      const count = new Set(
        allEntries.filter((e) => e.date.slice(0, 10) >= startStr && e.date.slice(0, 10) <= endStr).map((e) => e.date.slice(0, 10))
      ).size;
      weeks.push({ label: getWeekLabel(weekStart), entries: count });
    }
    return weeks;
  }, [allEntries]);

  // Day of week distribution
  const dayData = useMemo(() => {
    const counts = Array(7).fill(0);
    allEntries.forEach((e) => {
      const d = new Date(e.date + "T12:00:00");
      counts[d.getDay()]++;
    });
    return DAY_NAMES.map((name, i) => ({ name, entries: counts[i] }));
  }, [allEntries]);

  // Top tags
  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    allEntries.forEach((e) => {
      (e.tags ?? []).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [allEntries]);

  const maxWeekly = Math.max(...weeklyData.map((w) => w.entries), 1);

  if (allEntries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
        <p className="text-muted-foreground text-sm">Aún no hay entradas para mostrar estadísticas.</p>
        <p className="text-xs text-muted-foreground mt-1">Empieza a escribir bitácoras para ver tu progreso aquí.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">Tu progreso de aprendizaje en números.</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: "Racha actual", value: currentStreak, unit: "días", color: "text-orange-500" },
          { icon: TrendingUp, label: "Racha máxima", value: longestStreak, unit: "días", color: "text-primary" },
          { icon: FileText, label: "Total entradas", value: totalEntries, unit: "", color: "text-foreground" },
          { icon: CalendarDays, label: "Días activos", value: totalDays, unit: "", color: "text-foreground" },
        ].map((m) => (
          <div key={m.label} className="p-4 rounded-2xl bg-card border border-border shadow-card text-center">
            <m.icon className={`w-5 h-5 mx-auto mb-2 ${m.color}`} strokeWidth={1.5} />
            <p className={`text-2xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
            {m.unit && <p className="text-[10px] text-muted-foreground">{m.unit}</p>}
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly activity */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Actividad semanal (últimas 12 semanas)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} barSize={16}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "var(--foreground)" }}
              cursor={{ fill: "var(--secondary)" }}
              formatter={(v: number) => [`${v} día${v !== 1 ? "s" : ""}`, "Días con entrada"]}
            />
            <Bar dataKey="entries" radius={[6, 6, 0, 0]}>
              {weeklyData.map((w, i) => (
                <Cell key={i} fill={w.entries > 0 ? "var(--primary)" : "var(--secondary)"} fillOpacity={w.entries > 0 ? 0.8 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day of week */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Día más productivo</p>
        <div className="flex items-end gap-2 h-24">
          {dayData.map((d) => {
            const maxDay = Math.max(...dayData.map((x) => x.entries), 1);
            const height = Math.max(4, (d.entries / maxDay) * 80);
            const isMax = d.entries === maxDay && d.entries > 0;
            return (
              <div key={d.name} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-lg transition-all ${isMax ? "bg-primary" : "bg-secondary"}`}
                  style={{ height }}
                />
                <span className="text-[10px] text-muted-foreground font-medium">{d.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{d.entries}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top tags */}
      {topTags.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Skills más usados</p>
          <div className="space-y-2.5">
            {topTags.map(({ tag, count }) => {
              const pct = Math.round((count / topTags[0].count) * 100);
              return (
                <div key={tag} className="flex items-center gap-3">
                  <span className="text-xs text-foreground font-medium w-24 truncate">#{tag}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per project progress */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Progreso por espacio</p>
        {projects.map((p) => {
          const days = new Set(p.entries.map((e) => e.date.slice(0, 10))).size;
          const pct = Math.min(100, Math.round((days / p.goal_days) * 100));
          return (
            <div key={p.id} className="p-4 rounded-2xl bg-card border border-border shadow-card space-y-2">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                </div>
                <span className="text-xs font-semibold text-success">{days}/{p.goal_days} días</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full progress-gradient transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
