import { useState } from "react";
import { Calendar, Flame, Save, Trash2, FileDown } from "lucide-react";
import { getTodayEntry, isToday, type Project } from "@/hooks/useSupabaseProjects";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { MarkdownEditor } from "./MarkdownEditor";
import { EntryCard } from "./EntryCard";
import { exportProjectPdf } from "@/lib/export-pdf";

interface ProjectViewProps {
  project: Project;
  onAddEntry: (projectId: string, text: string) => void;
  onDelete: (projectId: string) => void;
}

export function ProjectView({ project, onAddEntry, onDelete }: ProjectViewProps) {
  const todayEntry = getTodayEntry(project.entries);
  const [text, setText] = useState(todayEntry?.text ?? "");
  const [saved, setSaved] = useState(!!todayEntry);

  const uniqueDays = new Set(project.entries.map((e) => e.date.slice(0, 10))).size;
  const progress = Math.min(100, Math.round((uniqueDays / project.goal_days) * 100));

  const streak = (() => {
    const days = [...new Set(project.entries.map((e) => e.date.slice(0, 10)))].sort().reverse();
    if (days.length === 0) return 0;
    let count = 0;
    const today = new Date().toISOString().slice(0, 10);
    let current = new Date();
    if (days[0] !== today) current.setDate(current.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const key = current.toISOString().slice(0, 10);
      if (days.includes(key)) { count++; current.setDate(current.getDate() - 1); }
      else break;
    }
    return count;
  })();

  const handleSave = () => {
    if (!text.trim()) return;
    onAddEntry(project.id, text.trim());
    setSaved(true);
  };

  const pastEntries = [...project.entries]
    .filter((e) => !isToday(e.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  // For PDF export, map to old format
  const pdfProject = {
    ...project,
    goalDays: project.goal_days,
    createdAt: project.created_at,
    entries: project.entries.map(e => ({ ...e, date: e.date })),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{project.emoji}</span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {uniqueDays} / {project.goal_days} días
                </span>
                {streak > 0 && (
                  <span className="flex items-center gap-1.5 text-success">
                    <Flame className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {streak} días seguidos
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportProjectPdf(pdfProject as any)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300" title="Exportar PDF">
            <FileDown className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => onDelete(project.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300" title="Eliminar">
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progreso hacia tu meta</span>
          <span className="font-semibold text-success">{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full progress-gradient transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
        {progress >= 100 && (
          <p className="text-xs text-primary-foreground bg-primary inline-block px-3 py-1 rounded-full font-medium">🎉 ¡Meta completada!</p>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
        <ActivityHeatmap entries={project.entries} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Registro de hoy</p>
          {saved && <span className="text-[10px] text-success font-medium">✓ Guardado</span>}
        </div>
        <MarkdownEditor value={text} onChange={(v) => { setText(v); setSaved(false); }} placeholder="## ¿Qué aprendiste hoy?&#10;&#10;Escribe en **Markdown**..." />
        <button onClick={handleSave} disabled={!text.trim() || saved} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100">
          <Save className="w-4 h-4" strokeWidth={1.5} />
          {saved ? "Guardado" : "Guardar registro"}
        </button>
      </div>

      <div className="space-y-3">
        {pastEntries.length > 0 && (
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Registros anteriores</p>
        )}
        {pastEntries.length === 0 && project.entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm italic">"El viaje de mil millas comienza con un solo paso."</p>
            <p className="text-xs text-muted-foreground mt-2">Escribe tu primera entrada arriba para empezar.</p>
          </div>
        )}
        {pastEntries.map((entry) => (
          <EntryCard key={entry.id} text={entry.text} date={entry.date} />
        ))}
      </div>
    </div>
  );
}
