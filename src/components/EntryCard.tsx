import { Lock, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface EntryCardProps {
  text: string;
  date: string;
  isFirst?: boolean;
}

function isLocked(dateStr: string): boolean {
  return dateStr.slice(0, 10) !== new Date().toISOString().slice(0, 10);
}

export function EntryCard({ text, date, isFirst }: EntryCardProps) {
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
      <div className="prose-devlog">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
