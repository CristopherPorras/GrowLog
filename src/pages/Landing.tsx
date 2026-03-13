import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Code2, ShieldCheck, Flame, BookOpen, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Landing = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!username.trim() || !displayName.trim()) {
        setError("Completa todos los campos");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim(), displayName.trim());
      if (error) {
        setError(error);
      } else {
        setConfirmEmail(true);
      }
    }
    setLoading(false);
  };

  if (confirmEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Revisa tu correo</h2>
          <p className="text-muted-foreground text-sm">
            Te hemos enviado un enlace de confirmación. Haz clic en él para activar tu cuenta y empezar a documentar tu progreso.
          </p>
          <button
            onClick={() => { setConfirmEmail(false); setMode("login"); }}
            className="text-sm text-primary font-medium hover:underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left: Showcase */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-16 xl:px-24">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">DevLog & Learn</h1>
              <p className="text-xs text-muted-foreground">Prueba de aprendizaje verificada</p>
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight mb-6">
            Demuestra lo que<br />
            <span className="text-primary">aprendes cada día</span>
          </h2>

          <p className="text-muted-foreground text-base mb-10 leading-relaxed">
            Documenta tu progreso de estudio con bitácoras diarias que se bloquean automáticamente a medianoche. 
            Comparte tu perfil verificado con reclutadores y demuestra tu constancia real.
          </p>

          <div className="space-y-5">
            {[
              { icon: Lock, title: "Registros Inmutables", desc: "Las entradas se bloquean al cambiar de día. Sin trampas." },
              { icon: ShieldCheck, title: "Verificación de Integridad", desc: "Cada registro muestra un badge verde de \"Verificado\"." },
              { icon: Flame, title: "Racha de Constancia", desc: "Heatmap estilo GitHub que muestra tu compromiso real." },
              { icon: BookOpen, title: "Perfil Público", desc: "Comparte tu link en LinkedIn y demuestra tu crecimiento." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="lg:w-[480px] flex items-center justify-center px-8 py-16 lg:border-l border-border bg-card/50">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground">
              {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login"
                ? "Accede a tu bitácora de aprendizaje."
                : "Empieza a documentar tu progreso hoy."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm">Nombre de usuario</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ej. carlos-dev"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm">Nombre para mostrar</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Carlos García"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Entrar" : "Crear cuenta"}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "login" ? (
                <>¿No tienes cuenta? <span className="text-primary font-medium">Regístrate</span></>
              ) : (
                <>¿Ya tienes cuenta? <span className="text-primary font-medium">Inicia sesión</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
