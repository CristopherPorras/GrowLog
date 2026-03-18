import { BookOpen, Flame, Plus, Code2, LogOut, Sun, Moon, Compass, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/hooks/useSupabaseProjects";
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
}

export function AppSidebar({ projects, activeProjectId, onSelectProject, onNewProject, onOpenProfile, onOpenExplore, onOpenStats }: AppSidebarProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <button onClick={() => onSelectProject(null)} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <Code2 className="w-4 h-4 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground tracking-tight">GrowLog</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">bitácoras verificadas</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">Espacios de Estudio</p>
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
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <span className="text-lg">{project.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{project.name}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full progress-gradient transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{progress}%</span>
                </div>
              </div>
              {uniqueDays >= 3 && <Flame className="w-3 h-3 text-success shrink-0" strokeWidth={1.5} />}
            </button>
          );
        })}
      </nav>

      <div className="p-3 space-y-2 border-t border-sidebar-border">
        <button onClick={onOpenProfile} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300">
          <BookOpen className="w-4 h-4" strokeWidth={1.5} />
          Mi Perfil Público
        </button>
        <button onClick={onOpenStats} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300">
          <BarChart2 className="w-4 h-4" strokeWidth={1.5} />
          Estadísticas
        </button>
        <button onClick={onOpenExplore} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300">
          <Compass className="w-4 h-4" strokeWidth={1.5} />
          Explorar perfiles
        </button>
        <button onClick={onNewProject} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01] active:scale-[0.98]">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nuevo Espacio
        </button>
        <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300">
          {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>
        <button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300">
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
