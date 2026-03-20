import { Flame, Plus, Code2, LogOut, Sun, Moon, Compass, BarChart2, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, UserProfile } from "@/hooks/useSupabaseProjects";
import { calculateStreak } from "@/hooks/useSupabaseProjects";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

interface AppSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onNewProject: () => void;
  onOpenProfile: () => void;
  onOpenExplore: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  profile?: UserProfile | null;
}

const LEVEL_TITLES = ["", "Principiante", "Aprendiz", "Estudiante", "Constante", "Dedicado", "Experto", "Maestro"];

export function AppSidebar({ projects, activeProjectId, onSelectProject, onNewProject, onOpenProfile, onOpenExplore, onOpenStats, onOpenSettings, profile }: AppSidebarProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const totalEntries = projects.flatMap((p) => p.entries).length;
  const level = Math.floor(Math.sqrt(totalEntries)) + 1;
  const xpInLevel = totalEntries - (level - 1) ** 2;
  const xpToNext = 2 * level - 1;
  const xpPercent = Math.round((xpInLevel / xpToNext) * 100);
  const levelTitle = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];
  const { current: streak } = calculateStreak(projects);
  const streakColor = streak === 0 ? "text-muted-foreground" : streak < 7 ? "text-blue-400" : streak < 30 ? "text-orange-400" : streak < 100 ? "text-red-500" : "text-yellow-400";

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <button onClick={() => onSelectProject(null)} className="flex items-center gap-2.5 group w-full">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <Code2 className="w-4 h-4 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground tracking-tight">GrowLog</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">bitácoras verificadas</p>
          </div>
        </button>
      </div>

      {/* Level / XP bar + Streak */}
      <div className="px-4 py-3 border-b border-sidebar-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-primary">Nv. {level}</span>
            <span className="text-[10px] text-muted-foreground">· {levelTitle}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[11px] font-bold tabular-nums", streakColor)}>{streak}</span>
            <Flame className={cn("w-3 h-3", streakColor)} strokeWidth={1.5} />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full progress-gradient transition-all duration-700"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground tabular-nums">{xpInLevel}/{xpToNext} XP</span>
          <span className="text-[9px] text-muted-foreground">días de racha</span>
        </div>
      </div>

      {/* Nav: Explorar + Estadísticas */}
      <div className="px-3 pt-3 pb-1 space-y-0.5">
        <button
          onClick={onOpenExplore}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <Compass className="w-4 h-4" strokeWidth={1.5} />
          Explorar
        </button>
        <button
          onClick={onOpenStats}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <BarChart2 className="w-4 h-4" strokeWidth={1.5} />
          Estadísticas
        </button>
      </div>

      {/* Section header for projects */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Mis espacios</p>
        <button
          onClick={onNewProject}
          title="Nuevo espacio"
          className="w-5 h-5 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>

      {/* Projects list */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {projects.length === 0 && (
          <button
            onClick={onNewProject}
            className="w-full text-left px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground italic transition-colors"
          >
            + Crea tu primer espacio
          </button>
        )}
        {projects.map((project) => {
          const isActive = activeProjectId === project.id;
          const uniqueDays = new Set(project.entries.map((e) => e.date.slice(0, 10))).size;
          const progress = Math.min(100, Math.round((uniqueDays / project.goal_days) * 100));
          return (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <span className="text-lg">{project.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{project.name}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full progress-gradient transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{progress}%</span>
                </div>
              </div>
              {uniqueDays >= 3 && <Flame className="w-3 h-3 text-success shrink-0" strokeWidth={1.5} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 space-y-0.5 border-t border-sidebar-border">
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: profile?.avatar_color ?? "#22c55e" }}
          >
            {profile?.display_name?.[0]?.toUpperCase() ?? profile?.username?.[0]?.toUpperCase() ?? <User className="w-3.5 h-3.5" />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-medium text-foreground truncate leading-tight">
              {profile?.display_name || "Mi Perfil"}
            </p>
            {profile?.username && (
              <p className="text-[10px] text-muted-foreground truncate leading-tight">@{profile.username}</p>
            )}
          </div>
        </button>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <Settings className="w-4 h-4" strokeWidth={1.5} />
          Configuración
        </button>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
