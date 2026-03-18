import { useState } from "react";
import { Calendar, Flame, Save, Trash2, FileDown, Wand2, Sparkles, X, ChevronDown, ChevronUp, Search, LayoutTemplate } from "lucide-react";
import { getTodayEntry, isToday, type Project } from "@/hooks/useSupabaseProjects";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { MarkdownEditor } from "./MarkdownEditor";
import { EntryCard } from "./EntryCard";
import { exportProjectPdf } from "@/lib/export-pdf";
import { generateEntryTitle, getSuggestions } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";

interface ProjectViewProps {
  project: Project;
  onAddEntry: (projectId: string, text: string, aiTitle?: string, tags?: string[]) => void;
  onDelete: (projectId: string) => void;
}

export function ProjectView({ project, onAddEntry, onDelete }: ProjectViewProps) {
  const todayEntry = getTodayEntry(project.entries);
  const [text, setText] = useState(todayEntry?.text ?? "");
  const [tags, setTags] = useState<string[]>(todayEntry?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(!!todayEntry);
  const [preview, setPreview] = useState(false);

  // AI state
  const [aiTitle, setAiTitle] = useState<string | null>(null);
  const [savedAiTitle, setSavedAiTitle] = useState<string>(todayEntry?.ai_title ?? "");
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showPastEntries, setShowPastEntries] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueDays = new Set(project.entries.map((e) => e.date.slice(0, 10))).size;
  const progress = Math.min(100, Math.round((uniqueDays / project.goal_days) * 100));

  const streak = (() => {
    const days = [...new Set(project.entries.map((e) => e.date.slice(0, 10)))].sort().reverse();
    if (days.length === 0) return 0;
    let count = 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    let current = new Date();
    if (days[0] !== todayStr) current.setDate(current.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const d = current;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (days.includes(key)) { count++; current.setDate(current.getDate() - 1); }
      else break;
    }
    return count;
  })();

  const handleSave = () => {
    if (!text.trim()) return;
    onAddEntry(project.id, text.trim(), savedAiTitle || undefined, tags.length > 0 ? tags : undefined);
    setSaved(true);
  };

  const handleAddTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "").toLowerCase();
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const handleGenerateTitle = async () => {
    if (!text.trim() || loadingTitle) return;
    setAiError(null);
    setLoadingTitle(true);
    try {
      const title = await generateEntryTitle(text);
      setAiTitle(title);
    } catch (e: any) {
      setAiError(`Error al generar título: ${e?.message ?? "desconocido"}`);
    } finally {
      setLoadingTitle(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!text.trim() || loadingSuggestions) return;
    setAiError(null);
    setLoadingSuggestions(true);
    try {
      const s = await getSuggestions(text);
      setAiSuggestions(s);
    } catch (e: any) {
      setAiError(`Error al obtener sugerencias: ${e?.message ?? "desconocido"}`);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const TEMPLATES = [
    {
      label: "📚 Concepto",
      content: "## 📚 Concepto aprendido\n\n**Concepto:** \n\n**¿Qué es?**\n\n\n**¿Cómo funciona?**\n\n\n**Ejemplo:**\n\n",
    },
    {
      label: "✅ Tutorial",
      content: "## ✅ Tutorial completado\n\n**Tutorial:** \n\n**Puntos clave:**\n- \n- \n- \n\n**Lo aplicaré en:**\n\n",
    },
    {
      label: "🚀 Proyecto",
      content: "## 🚀 Proyecto construido\n\n**Proyecto:** \n\n**¿Qué construí?**\n\n\n**Stack:**\n\n\n**Desafíos:**\n\n",
    },
    {
      label: "🐛 Bug resuelto",
      content: "## 🐛 Bug resuelto\n\n**Problema:** \n\n**Causa raíz:**\n\n\n**Solución:**\n\n\n**Aprendizaje:**\n\n",
    },
  ];

  const pastEntries = [...project.entries]
    .filter((e) => !isToday(e.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredPastEntries = searchQuery.trim()
    ? pastEntries.filter(
        (e) =>
          e.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.ai_title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : pastEntries;

  const pdfProject = {
    ...project,
    goalDays: project.goal_days,
    createdAt: project.created_at,
    entries: project.entries.map((e) => ({ ...e, date: e.date })),
  };

  const canUseAI = text.trim().length > 50;

  return (
    <div className="max-w-2xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">{project.emoji}</span>
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground leading-tight">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
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
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => exportProjectPdf(pdfProject as any)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" title="Exportar PDF">
            <FileDown className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => onDelete(project.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Eliminar">
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
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

      {/* Heatmap */}
      <div className="p-4 lg:p-5 rounded-2xl bg-card border border-border shadow-card overflow-x-auto">
        <ActivityHeatmap entries={project.entries} />
      </div>

      {/* Today's editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Registro de hoy</p>
          <div className="flex items-center gap-2 flex-wrap">
            {saved && <span className="text-[10px] text-success font-medium">✓ Guardado</span>}

            {/* AI buttons — always visible, disabled hint when not enough content */}
            <button
              onClick={handleGenerateTitle}
              disabled={!canUseAI || loadingTitle}
              title={canUseAI ? "Generar título con IA" : "Escribe al menos 50 caracteres para usar IA"}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingTitle ? (
                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" strokeWidth={1.5} />
              )}
              Título IA
            </button>
            <button
              onClick={handleGetSuggestions}
              disabled={!canUseAI || loadingSuggestions}
              title={canUseAI ? "Sugerencias de escritura" : "Escribe al menos 50 caracteres para usar IA"}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground border border-border hover:bg-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingSuggestions ? (
                <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" strokeWidth={1.5} />
              )}
              Sugerencias
            </button>
          </div>
        </div>

        {/* AI error */}
        {aiError && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {aiError}
            <button onClick={() => setAiError(null)}><X className="w-3.5 h-3.5" strokeWidth={2} /></button>
          </div>
        )}

        {/* AI generated title */}
        {aiTitle && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
            <Wand2 className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Título sugerido por IA</p>
              <p className="text-sm font-semibold text-foreground">{aiTitle}</p>
              <button
                onClick={() => {
                  const newText = `## ${aiTitle}\n\n${text.replace(/^##[^\n]*\n\n?/, "")}`;
                  setText(newText);
                  setSavedAiTitle(aiTitle!);
                  setSaved(false);
                  setAiTitle(null);
                }}
                className="mt-2 text-[11px] text-primary font-medium hover:underline"
              >
                Insertar en la bitácora →
              </button>
            </div>
            <button onClick={() => setAiTitle(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Templates */}
        <div>
          <button
            type="button"
            onClick={() => setShowTemplates((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <LayoutTemplate className="w-3 h-3" strokeWidth={1.5} />
            Plantillas
            {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showTemplates && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setText(t.content);
                    setSaved(false);
                    setShowTemplates(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-secondary border border-border text-[11px] font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <MarkdownEditor
          value={text}
          onChange={(v) => { setText(v); setSaved(false); }}
          placeholder="## ¿Qué aprendiste hoy?&#10;&#10;Escribe en **Markdown**..."
          preview={preview}
          onTogglePreview={() => setPreview((v) => !v)}
        />

        {/* AI suggestions panel */}
        {aiSuggestions && (
          <div className="p-4 rounded-2xl bg-card border border-border shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Sugerencias de IA</p>
              </div>
              <button onClick={() => setAiSuggestions(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
            <div className="prose-devlog">
              <ReactMarkdown>{aiSuggestions}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Tags input */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                #{tag}
                <button type="button" onClick={() => { setTags((t) => t.filter((x) => x !== tag)); setSaved(false); }} className="hover:text-destructive transition-colors">×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " " || e.key === ",") && tagInput.trim()) {
                  e.preventDefault();
                  handleAddTag(tagInput);
                  setSaved(false);
                }
              }}
              onBlur={() => { if (tagInput.trim()) { handleAddTag(tagInput); setSaved(false); } }}
              placeholder={tags.length === 0 ? "Agregar skills (ej: react, python)..." : "Agregar más..."}
              className="flex-1 min-w-[140px] text-[12px] bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none py-0.5"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!text.trim() || saved}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
        >
          <Save className="w-4 h-4" strokeWidth={1.5} />
          {saved ? "Guardado" : "Guardar registro"}
        </button>
      </div>

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowPastEntries((v) => !v)}
            className="flex items-center gap-2 w-full text-left"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex-1">
              Registros anteriores ({pastEntries.length})
            </p>
            {showPastEntries ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            )}
          </button>

          {showPastEntries && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en registros (texto, tags)..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {filteredPastEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No se encontraron registros para "{searchQuery}".</p>
              ) : (
                filteredPastEntries.map((entry) => (
                  <EntryCard key={entry.id} text={entry.text} date={entry.date} aiTitle={entry.ai_title} tags={entry.tags} />
                ))
              )}
            </>
          )}
        </div>
      )}

      {pastEntries.length === 0 && project.entries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm italic">"El viaje de mil millas comienza con un solo paso."</p>
          <p className="text-xs text-muted-foreground mt-2">Escribe tu primera entrada arriba para empezar.</p>
        </div>
      )}
    </div>
  );
}
