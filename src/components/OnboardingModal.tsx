import { useState } from "react";
import { ShieldCheck, Sparkles, Users, X } from "lucide-react";

interface OnboardingModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: ShieldCheck,
    color: "text-success",
    bg: "bg-success/10",
    title: "Bitácoras verificadas",
    desc: "Escribe tu registro diario. Al pasar la medianoche se bloquea automáticamente — nadie puede modificarlo. Tus reclutadores verán evidencia real de tu constancia.",
  },
  {
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "IA que te ayuda",
    desc: "Genera títulos automáticos para tus entradas, recibe sugerencias para mejorar tu escritura, y deja que la IA construya tu bio profesional basándose en lo que aprendes.",
  },
  {
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Perfil público compartible",
    desc: "Tu perfil vive en una URL pública. Compártelo en LinkedIn o tu CV. Otros estudiantes pueden encontrarte en 'Explorar' y ver tu progreso.",
  },
];

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-7 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 rounded-2xl ${current.bg} flex items-center justify-center mx-auto`}>
            <current.icon className={`w-8 h-8 ${current.color}`} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-all"
            >
              Anterior
            </button>
          )}
          <button
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:scale-[1.02] transition-all"
          >
            {isLast ? "¡Empezar!" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
