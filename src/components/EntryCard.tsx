import { Lock, ShieldCheck, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface EntryCardProps {
  text: string;
  date: string;
  aiTitle?: string;
  tags?: string[];
}

function isLocked(dateStr: string): boolean {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return dateStr.slice(0, 10) !== today;
}

export function EntryCard({ text, date, aiTitle, tags }: EntryCardProps) {
  const locked = isLocked(date);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`p-5 rounded-2xl bg-card border shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 ${locked ? "border-border" : "border-primary/30"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium capitalize">{formatDate(date)}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{formatTime(date)}</span>
        </div>
        {locked ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success">
            <ShieldCheck className="w-3 h-3" strokeWidth={2} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Verificado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Hoy</span>
          </div>
        )}
      </div>

      {locked && (
        <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
          <Lock className="w-3 h-3" strokeWidth={1.5} />
          <span className="text-[10px]">Registro bloqueado — solo lectura</span>
        </div>
      )}

      {aiTitle && (
        <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-border">
          <Wand2 className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-foreground">{aiTitle}</h3>
        </div>
      )}

      <div className="prose-devlog">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
