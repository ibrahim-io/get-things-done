import type { Project } from '../types';

const STORAGE_KEY = 'gtd_projects';

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function loadProjects(): Project[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  
  try {
    const projects = JSON.parse(data);
    // Convert date strings back to Date objects
    return projects.map((p: Project & { createdAt: string; completedAt?: string; startDate?: string; endDate?: string }) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
      startDate: p.startDate ? new Date(p.startDate) : undefined,
      endDate: p.endDate ? new Date(p.endDate) : undefined,
    }));
  } catch {
    return [];
  }
}
