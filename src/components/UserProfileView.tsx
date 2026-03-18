import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { fetchPublicProfile } from "@/hooks/useSupabaseProjects";
import { PublicProfile } from "./PublicProfile";

interface UserProfileViewProps {
  username: string;
  onBack: () => void;
}

export function UserProfileView({ username, onBack }: UserProfileViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetchPublicProfile(username).then((result) => {
      if (!result) setNotFound(true);
      else setData(result);
      setLoading(false);
    });
  }, [username]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Volver a Explorar
      </button>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : notFound ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">Perfil @{username} no encontrado.</p>
        </div>
      ) : (
        <PublicProfile projects={data.projects} profile={data.profile} isOwner={false} />
      )}
    </div>
  );
}
