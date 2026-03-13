import { useState, useEffect, useCallback } from "react";

export interface Entry {
  id: string;
  text: string;
  date: string; // ISO string
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  goalDays: number;
  entries: Entry[];
  createdAt: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
}

const STORAGE_KEY = "devlog-projects";
const PROFILE_KEY = "devlog-profile";

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
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

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { username: "dev-user", displayName: "Desarrollador", bio: "Aprendiendo cada día." };
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(loadProjects);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const addProject = useCallback((name: string, emoji: string, goalDays: number) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      emoji,
      goalDays,
      entries: [],
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject.id;
  }, []);

  const addEntry = useCallback((projectId: string, text: string) => {
    const today = getToday();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const existingIdx = p.entries.findIndex((e) => e.date.slice(0, 10) === today);
        if (existingIdx >= 0) {
          // Update today's entry
          const updated = [...p.entries];
          updated[existingIdx] = { ...updated[existingIdx], text };
          return { ...p, entries: updated };
        }
        // New entry
        const entry: Entry = {
          id: crypto.randomUUID(),
          text,
          date: new Date().toISOString(),
        };
        return { ...p, entries: [...p.entries, entry] };
      })
    );
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  return { projects, addProject, addEntry, deleteProject };
}
