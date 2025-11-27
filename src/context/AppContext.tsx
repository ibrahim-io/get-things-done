/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Project, Task, TabType } from '../types';
import { saveProjects, loadProjects } from '../services/storage';

interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  focusMode: boolean;
  currentTaskIndex: number;
  activeTab: TabType;
}

type Action =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_ACTIVE_PROJECT'; payload: string | null }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'SET_FOCUS_MODE'; payload: boolean }
  | { type: 'NEXT_TASK' }
  | { type: 'PREV_TASK' }
  | { type: 'SET_CURRENT_TASK_INDEX'; payload: number }
  | { type: 'COMPLETE_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'UNCOMPLETE_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'UPDATE_TASK'; payload: { projectId: string; taskId: string; updates: Partial<Task> } }
  | { type: 'UPDATE_PROJECT'; payload: { projectId: string; updates: Partial<Project> } }
  | { type: 'REORDER_TASKS'; payload: { projectId: string; tasks: Task[] } }
  | { type: 'COMPLETE_PROJECT'; payload: string }
  | { type: 'REOPEN_PROJECT'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType };

const initialState: AppState = {
  projects: [],
  activeProjectId: null,
  focusMode: false,
  currentTaskIndex: 0,
  activeTab: 'active',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
        activeProjectId: action.payload.id,
        currentTaskIndex: 0,
      };

    case 'DELETE_PROJECT': {
      const newProjects = state.projects.filter(p => p.id !== action.payload);
      return {
        ...state,
        projects: newProjects,
        activeProjectId: state.activeProjectId === action.payload 
          ? (newProjects.find(p => !p.completed)?.id || null)
          : state.activeProjectId,
      };
    }

    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload, currentTaskIndex: 0 };

    case 'TOGGLE_FOCUS_MODE':
      return { ...state, focusMode: !state.focusMode };

    case 'SET_FOCUS_MODE':
      return { ...state, focusMode: action.payload };

    case 'NEXT_TASK': {
      const activeProject = state.projects.find(p => p.id === state.activeProjectId);
      if (!activeProject) return state;
      const incompleteTasks = activeProject.tasks.filter(t => !t.completed);
      const maxIndex = incompleteTasks.length - 1;
      return {
        ...state,
        currentTaskIndex: Math.min(state.currentTaskIndex + 1, maxIndex),
      };
    }

    case 'PREV_TASK':
      return {
        ...state,
        currentTaskIndex: Math.max(state.currentTaskIndex - 1, 0),
      };

    case 'SET_CURRENT_TASK_INDEX':
      return { ...state, currentTaskIndex: action.payload };

    case 'COMPLETE_TASK': {
      const { projectId, taskId } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map(t =>
                  t.id === taskId ? { ...t, completed: true } : t
                ),
              }
            : p
        ),
      };
    }

    case 'UNCOMPLETE_TASK': {
      const { projectId, taskId } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map(t =>
                  t.id === taskId ? { ...t, completed: false } : t
                ),
              }
            : p
        ),
      };
    }

    case 'UPDATE_TASK': {
      const { projectId, taskId, updates } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map(t =>
                  t.id === taskId ? { ...t, ...updates } : t
                ),
              }
            : p
        ),
      };
    }

    case 'UPDATE_PROJECT': {
      const { projectId, updates } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === projectId ? { ...p, ...updates } : p
        ),
      };
    }

    case 'REORDER_TASKS': {
      const { projectId, tasks } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === projectId ? { ...p, tasks } : p
        ),
      };
    }

    case 'COMPLETE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload
            ? { ...p, completed: true, completedAt: new Date() }
            : p
        ),
        activeProjectId: state.activeProjectId === action.payload
          ? (state.projects.find(p => p.id !== action.payload && !p.completed)?.id || null)
          : state.activeProjectId,
        focusMode: state.activeProjectId === action.payload ? false : state.focusMode,
      };

    case 'REOPEN_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload
            ? { ...p, completed: false, completedAt: undefined }
            : p
        ),
      };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    default:
      return state;
  }
}

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeProject: Project | undefined;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = loadProjects();
    if (savedProjects.length > 0) {
      dispatch({ type: 'SET_PROJECTS', payload: savedProjects });
      const activeProject = savedProjects.find(p => !p.completed);
      if (activeProject) {
        dispatch({ type: 'SET_ACTIVE_PROJECT', payload: activeProject.id });
      }
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    saveProjects(state.projects);
  }, [state.projects]);

  const activeProject = state.projects.find(p => p.id === state.activeProjectId);

  return (
    <AppContext.Provider value={{ state, dispatch, activeProject }}>
      {children}
    </AppContext.Provider>
  );
}
