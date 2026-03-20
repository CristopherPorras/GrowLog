import { useState } from "react";
import { Menu } from "lucide-react";
import { useSupabaseProjects, useProfile, getToday } from "@/hooks/useSupabaseProjects";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardView } from "@/components/DashboardView";
import { ProjectView } from "@/components/ProjectView";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { PublicProfile } from "@/components/PublicProfile";
import { ExploreView } from "@/components/ExploreView";
import { UserProfileView } from "@/components/UserProfileView";
import { StatsView } from "@/components/StatsView";
import { SettingsView } from "@/components/SettingsView";
import { OnboardingModal } from "@/components/OnboardingModal";
import { cn } from "@/lib/utils";

const Index = () => {
  const { projects, addProject, addEntry, deleteProject, loading } = useSupabaseProjects();
  const { profile, updateProfile } = useProfile();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("growlog-onboarding-done"));

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const handleNewProject = async (name: string, emoji: string, goalDays: number) => {
    const id = await addProject(name, emoji, goalDays);
    if (id) setActiveProjectId(id);
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setActiveProjectId(null);
  };

  const resetViews = () => {
    setShowProfile(false);
    setShowExplore(false);
    setShowStats(false);
    setShowSettings(false);
    setViewingUsername(null);
    setActiveProjectId(null);
  };

  const handleSelectProject = (id: string | null) => {
    resetViews();
    setActiveProjectId(id);
    setSidebarOpen(false);
  };

  const handleOpenProfile = () => {
    resetViews();
    setShowProfile(true);
    setSidebarOpen(false);
  };

  const handleOpenExplore = () => {
    resetViews();
    setShowExplore(true);
    setSidebarOpen(false);
  };

  const handleOpenStats = () => {
    resetViews();
    setShowStats(true);
    setSidebarOpen(false);
  };

  const handleOpenSettings = () => {
    resetViews();
    setShowSettings(true);
    setSidebarOpen(false);
  };

  const handleViewProfile = (username: string) => {
    setViewingUsername(username);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    if (viewingUsername) {
      return <UserProfileView username={viewingUsername} onBack={() => setViewingUsername(null)} />;
    }
    if (showSettings) {
      return <SettingsView profile={profile ?? { username: "", display_name: "", bio: "" }} onUpdateProfile={updateProfile} />;
    }
    if (showStats) {
      return <StatsView projects={projects} />;
    }
    if (showExplore) {
      return <ExploreView onViewProfile={handleViewProfile} />;
    }
    if (showProfile && profile) {
      return <PublicProfile projects={projects} profile={profile} isOwner onUpdateProfile={updateProfile} onOpenSettings={handleOpenSettings} />;
    }
    if (activeProject) {
      return <ProjectView key={`${activeProject.id}-${getToday()}`} project={activeProject} onAddEntry={addEntry} onDelete={handleDelete} />;
    }
    return <DashboardView projects={projects} onSelectProject={handleSelectProject} onNewProject={() => setDialogOpen(true)} profile={profile} />;
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0 lg:h-full",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AppSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onNewProject={() => { setDialogOpen(true); setSidebarOpen(false); }}
          onOpenProfile={handleOpenProfile}
          onOpenStats={handleOpenStats}
          onOpenExplore={handleOpenExplore}
          onOpenSettings={handleOpenSettings}
          profile={profile}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-12 glass border-b border-border/50 flex items-center px-4 lg:px-8 sticky top-0 z-10">
          <button
            className="mr-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <span className="text-xs text-muted-foreground font-medium truncate">
            {viewingUsername ? `@${viewingUsername}` : showSettings ? "Configuración" : showStats ? "Estadísticas" : showExplore ? "Explorar" : showProfile ? "Mi Perfil" : activeProject ? `${activeProject.emoji} ${activeProject.name}` : "Dashboard"}
          </span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-16 lg:py-10 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleNewProject} />
      {showOnboarding && (
        <OnboardingModal onClose={() => {
          localStorage.setItem("growlog-onboarding-done", "1");
          setShowOnboarding(false);
        }} />
      )}
    </div>
  );
};

export default Index;
