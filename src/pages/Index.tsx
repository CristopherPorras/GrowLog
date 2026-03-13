import { useState } from "react";
import { useSupabaseProjects, useProfile } from "@/hooks/useSupabaseProjects";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardView } from "@/components/DashboardView";
import { ProjectView } from "@/components/ProjectView";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { PublicProfile } from "@/components/PublicProfile";

const Index = () => {
  const { projects, addProject, addEntry, deleteProject, loading } = useSupabaseProjects();
  const { profile } = useProfile();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const handleNewProject = async (name: string, emoji: string, goalDays: number) => {
    const id = await addProject(name, emoji, goalDays);
    if (id) setActiveProjectId(id);
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setActiveProjectId(null);
  };

  const handleSelectProject = (id: string | null) => {
    setShowProfile(false);
    setActiveProjectId(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    if (showProfile && profile) {
      return <PublicProfile projects={projects} profile={profile} />;
    }
    if (activeProject) {
      return <ProjectView project={activeProject} onAddEntry={addEntry} onDelete={handleDelete} />;
    }
    return <DashboardView projects={projects} onSelectProject={handleSelectProject} onNewProject={() => setDialogOpen(true)} />;
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={() => setDialogOpen(true)}
        onOpenProfile={() => { setShowProfile(true); setActiveProjectId(null); }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 glass border-b border-border/50 flex items-center px-8 sticky top-0 z-10">
          <span className="text-xs text-muted-foreground font-medium">
            {showProfile ? "Perfil Público" : activeProject ? `${activeProject.emoji} ${activeProject.name}` : "Dashboard"}
          </span>
        </header>
        <main className="flex-1 px-8 py-10 lg:px-16 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleNewProject} />
    </div>
  );
};

export default Index;
