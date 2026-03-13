import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Eye, Pencil, Bold, List, Code, Quote, Heading2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, disabled, placeholder }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("devlog-editor") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  if (disabled) {
    return (
      <div className="prose-devlog rounded-2xl border border-border bg-card p-5 min-h-[120px]">
        <ReactMarkdown>{value || "_Sin contenido_"}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-0.5">
          {[
            { icon: Bold, action: () => insertMarkdown("**", "**"), title: "Negrita" },
            { icon: Heading2, action: () => insertMarkdown("## "), title: "Título" },
            { icon: List, action: () => insertMarkdown("- "), title: "Lista" },
            { icon: Code, action: () => insertMarkdown("`", "`"), title: "Código" },
            { icon: Quote, action: () => insertMarkdown("> "), title: "Cita" },
          ].map(({ icon: Icon, action, title }) => (
            <button
              key={title}
              type="button"
              onClick={action}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              title={title}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200",
            preview ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          {preview ? <Eye className="w-3 h-3" strokeWidth={1.5} /> : <Pencil className="w-3 h-3" strokeWidth={1.5} />}
          {preview ? "Vista previa" : "Editar"}
        </button>
      </div>

      {/* Content */}
      {preview ? (
        <div className="prose-devlog p-5 min-h-[160px]">
          <ReactMarkdown>{value || "_Escribe algo..._"}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          id="devlog-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "## ¿Qué aprendiste hoy?\n\nEscribe en Markdown..."}
          className="w-full min-h-[160px] p-5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none font-mono leading-relaxed"
        />
      )}
    </div>
  );
}
