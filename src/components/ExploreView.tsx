import { useState, useEffect } from "react";
import { Search, BookOpen, CalendarDays, FileText, ExternalLink, AlertTriangle, Copy, Check } from "lucide-react";
import { fetchAllPublicProfiles, type PublicProfileSummary } from "@/hooks/useSupabaseProjects";

const FIX_SQL = `-- Ejecutar en Supabase → SQL Editor:

CREATE POLICY IF NOT EXISTS "profiles_public_read"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "entries_public_read"
  ON entries FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "projects_public_read"
  ON projects FOR SELECT TO authenticated USING (true);`;

interface ExploreViewProps {
  onViewProfile: (username: string) => void;
}

export function ExploreView({ onViewProfile }: ExploreViewProps) {
  const [profiles, setProfiles] = useState<PublicProfileSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAllPublicProfiles().then(({ profiles: data, error: err }) => {
      setProfiles(data);
      setError(err);
      setLoading(false);
    });
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(FIX_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filtered = search.trim()
    ? profiles.filter(
        (p) =>
          p.display_name.toLowerCase().includes(search.toLowerCase()) ||
          p.username.toLowerCase().includes(search.toLowerCase()) ||
          p.bio.toLowerCase().includes(search.toLowerCase())
      )
    : profiles;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Explorar</h1>
        <p className="text-sm text-muted-foreground">Descubre estudiantes y desarrolladores que documentan su aprendizaje.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o usuario..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : error ? (
        /* RLS error — show SQL instructions */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <p className="text-sm font-semibold">Las políticas de Supabase bloquean la lectura pública</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Para ver todos los perfiles, ejecutá este SQL en{" "}
              <span className="font-semibold text-foreground">supabase.com → tu proyecto → SQL Editor</span>:
            </p>
            <div className="relative">
              <pre className="text-[10px] font-mono bg-card rounded-xl p-3 overflow-x-auto text-foreground border border-border leading-relaxed">
                {FIX_SQL}
              </pre>
              <button
                onClick={handleCopySQL}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-[10px] font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-primary" strokeWidth={2} /> : <Copy className="w-3 h-3" strokeWidth={1.5} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Después de ejecutarlo, recargá la página y los perfiles aparecerán.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-muted-foreground text-sm">
            {search ? `No se encontraron perfiles para "${search}".` : "Aún no hay perfiles registrados."}
          </p>
          {!search && (
            <p className="text-xs text-muted-foreground">
              Los perfiles aparecen cuando los usuarios configuran su nombre de usuario en su perfil público.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            {filtered.length} {filtered.length === 1 ? "perfil" : "perfiles"}
          </p>
          {filtered.map((profile) => (
            <button
              key={profile.username}
              onClick={() => onViewProfile(profile.username)}
              className="w-full p-5 rounded-2xl bg-card border border-border shadow-card text-left transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/40 group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 select-none">
                  {(profile.display_name?.[0] ?? "?").toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{profile.display_name}</p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{profile.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3">
                    {[
                      { icon: BookOpen, value: profile.projectCount, label: profile.projectCount === 1 ? "espacio" : "espacios" },
                      { icon: FileText, value: profile.entryCount, label: profile.entryCount === 1 ? "entrada" : "entradas" },
                      { icon: CalendarDays, value: profile.dayCount, label: profile.dayCount === 1 ? "día" : "días" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1 text-muted-foreground">
                        <s.icon className="w-3 h-3" strokeWidth={1.5} />
                        <span className="text-xs font-medium tabular-nums">{s.value}</span>
                        <span className="text-[10px]">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
