import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMOJIS = ["📚", "🎯", "💻", "🎨", "🌍", "🧠", "🎸", "📐", "🔬", "✍️", "⚛️", "🐍"];

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, emoji: string, goalDays: number) => void;
}

export function NewProjectDialog({ open, onOpenChange, onSubmit }: NewProjectDialogProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💻");
  const [goalDays, setGoalDays] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), emoji, goalDays);
    setName("");
    setEmoji("💻");
    setGoalDays(30);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Nuevo Espacio de Estudio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm">Nombre del espacio</Label>
            <Input
              id="project-name"
              placeholder="ej. React Avanzado, Python ML..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Ícono</Label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-200 ${
                    emoji === e
                      ? "bg-primary ring-2 ring-primary scale-105"
                      : "bg-secondary hover:bg-muted hover:scale-105"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-days" className="text-sm">Meta (días de estudio)</Label>
            <Input id="goal-days" type="number" min={1} max={365} value={goalDays} onChange={(e) => setGoalDays(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">
              El progreso se calcula con los días únicos de estudio documentado.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01] active:scale-[0.98]"
          >
            Crear Espacio
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
