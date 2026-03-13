import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  text: string;
  date: string;
}

interface ActivityHeatmapProps {
  entries: Entry[];
}

export function ActivityHeatmap({ entries }: ActivityHeatmapProps) {
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      const key = e.date.slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [entries]);

  const cells = useMemo(() => {
    const today = new Date();
    const result: { date: string; count: number; isToday: boolean }[] = [];
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: dayCounts[key] || 0, isToday: i === 0 });
    }
    return result;
  }, [dayCounts]);

  const weeks: typeof cells[] = [];
  let currentWeek: typeof cells = [];
  const firstDay = new Date(cells[0].date).getDay();
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ date: "", count: 0, isToday: false });
  }
  cells.forEach((cell) => {
    currentWeek.push(cell);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-secondary";
    if (count === 1) return "bg-primary/40";
    if (count === 2) return "bg-primary/65";
    return "bg-primary";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Constancia · Últimos 3 meses</p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Menos</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn("w-2.5 h-2.5 rounded-[3px]", getIntensityClass(i))} />
          ))}
          <span>Más</span>
        </div>
      </div>
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, ci) => (
              <div
                key={ci}
                title={cell.date ? `${cell.date}: ${cell.count} entrada(s)` : ""}
                className={cn(
                  "w-3 h-3 rounded-[3px] transition-all duration-300",
                  cell.date === "" ? "bg-transparent" : getIntensityClass(cell.count),
                  cell.isToday && "ring-1 ring-foreground/20 ring-offset-1 ring-offset-background"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
