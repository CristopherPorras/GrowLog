import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicProfile, type Project, type UserProfile } from "@/hooks/useSupabaseProjects";
import { PublicProfile } from "@/components/PublicProfile";

const PublicProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<{ profile: UserProfile; projects: Project[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    fetchPublicProfile(username).then((result) => {
      if (result) {
        setData(result);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-2xl font-semibold text-foreground">404</p>
          <p className="text-muted-foreground text-sm">Perfil no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <PublicProfile projects={data.projects} profile={data.profile} />
    </div>
  );
};

export default PublicProfilePage;
