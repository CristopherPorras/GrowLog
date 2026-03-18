import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bold, Italic, List, ListOrdered, Code, Quote, Heading2, Heading3,
  Link2, Minus, Eye, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  preview?: boolean;
  onTogglePreview?: () => void;
}

export function MarkdownEditor({
  value,
  onChange,
  disabled,
  placeholder,
  preview: externalPreview,
  onTogglePreview,
}: MarkdownEditorProps) {
  const [internalPreview, setInternalPreview] = useState(false);
  const preview = externalPreview !== undefined ? externalPreview : internalPreview;
  const togglePreview = onTogglePreview ?? (() => setInternalPreview((v) => !v));

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(180, el.scrollHeight) + "px";
  }, [value]);

  const insertMarkdown = (prefix: string, suffix = "", block = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);

    let newText: string;
    let cursorStart: number;
    let cursorEnd: number;

    if (block) {
      // Insert on new line
      const before = value.substring(0, start);
      const after = value.substring(end);
      const needsNewline = before.length > 0 && !before.endsWith("\n");
      const insertedPrefix = needsNewline ? "\n" + prefix : prefix;
      newText = before + insertedPrefix + selected + suffix + after;
      cursorStart = start + insertedPrefix.length;
      cursorEnd = cursorStart + selected.length;
    } else {
      newText = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
      cursorStart = start + prefix.length;
      cursorEnd = cursorStart + selected.length;
    }

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorStart, cursorEnd);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), title: "Negrita" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), title: "Cursiva" },
    { icon: Heading2, action: () => insertMarkdown("## ", "", true), title: "Título H2" },
    { icon: Heading3, action: () => insertMarkdown("### ", "", true), title: "Título H3" },
    { icon: List, action: () => insertMarkdown("- ", "", true), title: "Lista" },
    { icon: ListOrdered, action: () => insertMarkdown("1. ", "", true), title: "Lista numerada" },
    { icon: Code, action: () => insertMarkdown("`", "`"), title: "Código inline" },
    { icon: Quote, action: () => insertMarkdown("> ", "", true), title: "Cita" },
    { icon: Link2, action: () => insertMarkdown("[", "](url)"), title: "Enlace" },
    { icon: Minus, action: () => insertMarkdown("\n---\n", ""), title: "Separador" },
  ];

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
      <div className="flex items-center justify-between border-b border-border bg-secondary/30">
        {/* Scrollable buttons row */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
          {toolbarButtons.map(({ icon: Icon, action, title }) => (
            <button
              key={title}
              type="button"
              onClick={action}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 shrink-0 touch-manipulation"
              title={title}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          ))}
        </div>

        {/* Preview toggle */}
        <div className="shrink-0 px-2 border-l border-border">
          <button
            type="button"
            onClick={togglePreview}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
              preview ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {preview ? <Eye className="w-3 h-3" strokeWidth={1.5} /> : <Pencil className="w-3 h-3" strokeWidth={1.5} />}
            <span className="hidden sm:inline">{preview ? "Vista previa" : "Editar"}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {preview ? (
        <div className="prose-devlog p-5 min-h-[180px]">
          <ReactMarkdown>{value || "_Escribe algo..._"}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "## ¿Qué aprendiste hoy?\n\nEscribe en Markdown..."}
          className="w-full min-h-[180px] p-5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none font-mono leading-relaxed"
          style={{ overflow: "hidden" }}
        />
      )}
    </div>
  );
}
