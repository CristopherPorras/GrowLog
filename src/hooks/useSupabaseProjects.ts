import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Entry {
  id: string;
  text: string;
  date: string;
  created_at: string;
  ai_title?: string;
  tags?: string[];
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  goal_days: number;
  entries: Entry[];
  created_at: string;
}

export interface UserProfile {
  username: string;
  display_name: string;
  bio: string;
}

export function getToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr.slice(0, 10) === getToday();
}

export function isLocked(dateStr: string): boolean {
  return !isToday(dateStr);
}

export function getTodayEntry(entries: Entry[]): Entry | undefined {
  const today = getToday();
  return entries.find((e) => e.date.slice(0, 10) === today);
}

export function useSupabaseProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) { setProjects([]); setLoading(false); return; }
    
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!projectsData) { setLoading(false); return; }

    const { data: entriesData } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    const entriesByProject: Record<string, Entry[]> = {};
    (entriesData || []).forEach((e: any) => {
      if (!entriesByProject[e.project_id]) entriesByProject[e.project_id] = [];
      entriesByProject[e.project_id].push({
        id: e.id,
        text: e.text,
        date: e.date,
        created_at: e.created_at,
        ai_title: e.ai_title ?? undefined,
        tags: e.tags ?? [],
      });
    });

    setProjects(
      projectsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        goal_days: p.goal_days,
        entries: entriesByProject[p.id] || [],
        created_at: p.created_at,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const addProject = useCallback(async (name: string, emoji: string, goalDays: number) => {
    if (!user) return "";
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name, emoji, goal_days: goalDays })
      .select("id")
      .single();
    if (error || !data) return "";
    await fetchProjects();
    return data.id;
  }, [user, fetchProjects]);

  const addEntry = useCallback(async (projectId: string, text: string, aiTitle?: string, tags?: string[]) => {
    if (!user) return;
    const today = getToday();

    // Check if today's entry exists
    const { data: existing } = await supabase
      .from("entries")
      .select("id")
      .eq("project_id", projectId)
      .eq("date", today)
      .maybeSingle();

    const payload: Record<string, unknown> = { text };
    if (aiTitle !== undefined) payload.ai_title = aiTitle;
    if (tags !== undefined) payload.tags = tags;

    if (existing) {
      await supabase.from("entries").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("entries").insert({
        project_id: projectId,
        user_id: user.id,
        date: today,
        ...payload,
      });
    }
    await fetchProjects();
  }, [user, fetchProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    await supabase.from("projects").delete().eq("id", projectId);
    await fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, addProject, addEntry, deleteProject, refetch: fetchProjects };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username, display_name, bio")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as UserProfile);
      });
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await supabase.from("profiles").update(updates).eq("user_id", user.id);
    setProfile((prev) => prev ? { ...prev, ...updates } : null);
  }, [user]);

  return { profile, updateProfile };
}

export interface PublicProfileSummary {
  username: string;
  display_name: string;
  bio: string;
  entryCount: number;
  dayCount: number;
  projectCount: number;
}

export async function fetchAllPublicProfiles(): Promise<{ profiles: PublicProfileSummary[]; error: string | null }> {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("username, display_name, bio, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (profilesError) {
    console.error("[Explorar] Error profiles:", profilesError.message);
    return { profiles: [], error: profilesError.message };
  }

  if (!profiles || profiles.length === 0) return { profiles: [], error: null };

  const userIds = profiles.map((p: any) => p.user_id);

  const [{ data: entries, error: entriesError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase.from("entries").select("user_id, date").in("user_id", userIds),
    supabase.from("projects").select("user_id").in("user_id", userIds),
  ]);

  if (entriesError) console.warn("[Explorar] Error entries:", entriesError.message);
  if (projectsError) console.warn("[Explorar] Error projects:", projectsError.message);

  const result = profiles
    .map((profile: any) => {
      const userEntries = (entries || []).filter((e: any) => e.user_id === profile.user_id);
      const userProjects = (projects || []).filter((p: any) => p.user_id === profile.user_id);
      const days = new Set(userEntries.map((e: any) => e.date.slice(0, 10))).size;
      return {
        username: profile.username ?? "",
        display_name: profile.display_name ?? profile.username ?? "Usuario",
        bio: profile.bio ?? "",
        entryCount: userEntries.length,
        dayCount: days,
        projectCount: userProjects.length,
      };
    })
    .filter((p: PublicProfileSummary) => p.username);

  return { profiles: result, error: null };
}

// For public profile page
export async function fetchPublicProfile(username: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) return null;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", (profile as any).user_id)
    .order("created_at", { ascending: true });

  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", (profile as any).user_id)
    .order("date", { ascending: true });

  const entriesByProject: Record<string, Entry[]> = {};
  (entries || []).forEach((e: any) => {
    if (!entriesByProject[e.project_id]) entriesByProject[e.project_id] = [];
    entriesByProject[e.project_id].push({
      id: e.id,
      text: e.text,
      date: e.date,
      created_at: e.created_at,
    });
  });

  return {
    profile: {
      username: (profile as any).username,
      display_name: (profile as any).display_name,
      bio: (profile as any).bio,
    },
    projects: (projects || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      goal_days: p.goal_days,
      entries: entriesByProject[p.id] || [],
      created_at: p.created_at,
    })),
  };
}
