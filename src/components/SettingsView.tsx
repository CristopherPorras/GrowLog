import { useState } from "react";
import {
  User, MapPin, Link2, Github, Linkedin, Twitter, Save, Globe,
  Briefcase, Shield, Mail, Key, Eye, EyeOff, Check, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/hooks/useSupabaseProjects";

const AVATAR_COLORS = [
  "#22c55e", "#3b82f6", "#a855f7", "#f97316", "#ec4899", "#14b8a6",
];

function isValidUrl(url: string): boolean {
  if (!url) return true;
  try { new URL(url.startsWith("http") ? url : `https://${url}`); return true; }
  catch { return false; }
}

function normalizeUrl(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

type Tab = "perfil" | "redes" | "cuenta" | "privacidad";

export function SettingsView({ profile, onUpdateProfile }: SettingsViewProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("perfil");

  // Perfil fields
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [username, setUsername]       = useState(profile.username ?? "");
  const [bio, setBio]                 = useState(profile.bio ?? "");
  const [role, setRole]               = useState(profile.role ?? "");
  const [location, setLocation]       = useState(profile.location ?? "");
  const [website, setWebsite]         = useState(profile.website ?? "");
  const [avatarColor, setAvatarColor] = useState(profile.avatar_color ?? AVATAR_COLORS[0]);

  // Redes fields
  const [github, setGithub]     = useState(profile.github ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedin ?? "");
  const [twitter, setTwitter]   = useState(profile.twitter ?? "");

  // Privacy
  const [isPublic, setIsPublic] = useState(profile.is_public ?? true);

  // State
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [resetSent, setResetSent]       = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = "El nombre es obligatorio";
    if (username && !/^[a-z0-9_-]{3,30}$/.test(username))
      e.username = "Solo letras minúsculas, números, _ o - (3-30 caracteres)";
    if (website && !isValidUrl(website)) e.website = "URL no válida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onUpdateProfile({
      display_name: displayName.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim().slice(0, 300),
      role: role.trim().slice(0, 60),
      location: location.trim().slice(0, 60),
      website: website ? normalizeUrl(website) : "",
      github: github.trim(),
      linkedin: linkedin.trim(),
      twitter: twitter.replace(/^@/, "").trim(),
      avatar_color: avatarColor,
      is_public: isPublic,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    setResetSent(true);
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "perfil",    label: "Perfil",        icon: User },
    { id: "redes",     label: "Redes",         icon: Globe },
    { id: "cuenta",    label: "Cuenta",        icon: Shield },
    { id: "privacidad",label: "Privacidad",    icon: Eye },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">Administrá tu perfil, redes y preferencias.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
              activeTab === id
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── PERFIL ── */}
      {activeTab === "perfil" && (
        <div className="space-y-6">
          {/* Avatar */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Avatar</p>
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white select-none shrink-0 transition-colors duration-300"
                style={{ background: avatarColor }}
              >
                {(displayName?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAvatarColor(color)}
                    className="w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 ring-offset-2 ring-offset-card"
                    style={{
                      background: color,
                      boxShadow: avatarColor === color ? `0 0 0 2px ${color}` : "none",
                      outline: avatarColor === color ? "2px solid white" : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Información personal</p>

            <Field label="Nombre para mostrar" error={errors.displayName} required>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                placeholder="Tu nombre completo"
                className={inputCls(!!errors.displayName)}
              />
            </Field>

            <Field label="Usuario (@)" error={errors.username} hint="Solo letras minúsculas, números, _ o -">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  maxLength={30}
                  placeholder="tuusuario"
                  className={`${inputCls(!!errors.username)} pl-7`}
                />
              </div>
            </Field>

            <Field label="Bio" hint={`${bio.length}/300`}>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Cuéntale al mundo en qué estás trabajando..."
                className={`${inputCls(false)} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Rol / Título" icon={Briefcase}>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  maxLength={60}
                  placeholder="Ej: Estudiante de Ingeniería"
                  className={inputCls(false)}
                />
              </Field>
              <Field label="Ubicación" icon={MapPin}>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={60}
                  placeholder="Ej: Buenos Aires, Argentina"
                  className={inputCls(false)}
                />
              </Field>
            </div>

            <Field label="Sitio web" icon={Link2} error={errors.website}>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://tuportafolio.com"
                className={inputCls(!!errors.website)}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ── REDES SOCIALES ── */}
      {activeTab === "redes" && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Redes sociales</p>
          <p className="text-xs text-muted-foreground">Estas aparecerán en tu perfil público.</p>

          <Field label="GitHub" icon={Github}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">github.com/</span>
              <input
                value={github}
                onChange={(e) => setGithub(e.target.value.replace(/.*github\.com\//i, "").trim())}
                placeholder="tuusuario"
                className={`${inputCls(false)} pl-[95px]`}
              />
            </div>
          </Field>

          <Field label="LinkedIn" icon={Linkedin}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">linkedin.com/in/</span>
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value.replace(/.*linkedin\.com\/in\//i, "").trim())}
                placeholder="tuusuario"
                className={`${inputCls(false)} pl-[118px]`}
              />
            </div>
          </Field>

          <Field label="Twitter / X" icon={Twitter}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value.replace(/^@/, "").trim())}
                placeholder="tuusuario"
                className={`${inputCls(false)} pl-7`}
              />
            </div>
          </Field>
        </div>
      )}

      {/* ── CUENTA ── */}
      {activeTab === "cuenta" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Cuenta</p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" strokeWidth={1.5} /> Correo electrónico
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-muted-foreground">
                {user?.email}
                <span className="ml-auto text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">Solo lectura</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" strokeWidth={1.5} /> Contraseña
              </label>
              {resetSent ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-success/10 border border-success/20 text-xs text-success">
                  <Check className="w-4 h-4" strokeWidth={2} />
                  Te enviamos un email para cambiar tu contraseña. Revisá tu bandeja de entrada.
                </div>
              ) : (
                <button
                  onClick={handlePasswordReset}
                  disabled={sendingReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  {sendingReset ? (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" strokeWidth={1.5} />
                  )}
                  Enviar link para cambiar contraseña
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} /> Columnas adicionales en Supabase
            </p>
            <p className="text-xs text-muted-foreground">
              Para guardar rol, ubicación, web y redes sociales ejecutá este SQL en{" "}
              <span className="font-semibold text-foreground">Supabase → SQL Editor</span>:
            </p>
            <pre className="text-[10px] font-mono bg-card rounded-lg p-3 overflow-x-auto text-foreground border border-border leading-relaxed">
{`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS github TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS twitter TEXT,
  ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#22c55e',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;`}
            </pre>
          </div>
        </div>
      )}

      {/* ── PRIVACIDAD ── */}
      {activeTab === "privacidad" && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-card space-y-5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Privacidad</p>

          <Toggle
            label="Aparecer en Explorar"
            description="Tu perfil será visible para otros usuarios de GrowLog."
            icon={isPublic ? Eye : EyeOff}
            checked={isPublic}
            onChange={setIsPublic}
          />

          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Recordá que:</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Las entradas del día actual nunca son públicas.</li>
              <li>Las entradas pasadas se bloquean y se verifican automáticamente.</li>
              <li>Tu correo electrónico nunca se muestra públicamente.</li>
              <li>Podés desactivar tu perfil público en cualquier momento.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Save button (not shown for Cuenta tab) */}
      {activeTab !== "cuenta" && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" strokeWidth={2} />
          ) : (
            <Save className="w-4 h-4" strokeWidth={1.5} />
          )}
          {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar cambios"}
        </button>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 rounded-xl bg-secondary border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
    hasError ? "border-destructive/60" : "border-border"
  }`;
}

function Field({
  label, children, hint, error, icon: Icon, required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  icon?: React.ElementType;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
        {label}
        {required && <span className="text-destructive">*</span>}
        {hint && !error && <span className="ml-auto text-[10px] text-muted-foreground/70">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function Toggle({
  label, description, icon: Icon, checked, onChange,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-2.5">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-300 shrink-0 ${checked ? "bg-primary" : "bg-secondary border border-border"}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
