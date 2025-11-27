export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  order: number;
}

export type Priority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  priority?: Priority;
  startDate?: Date;
  endDate?: Date;
}

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  focusMode: boolean;
  currentTaskIndex: number;
}

export type TabType = 'active' | 'gantt' | 'completed';
