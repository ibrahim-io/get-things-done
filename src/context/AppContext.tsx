import React, { createContext, useReducer, useEffect, type ReactNode } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Project, Task, TabType, Priority } from '../types';
import { saveProjects, loadProjects } from '../services/storage';
import { useAuth } from './AuthContext';

// Limits
const PROJECT_LIMIT_GUEST = 3;
const PROJECT_LIMIT_LOGGED_IN = 10;

interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  focusMode: boolean;
  currentTaskIndex: number;
  activeTab: TabType;
  loading: boolean;
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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType };

const initialState: AppState = {
  projects: [],
  activeProjectId: null,
  focusMode: false,
  currentTaskIndex: 0,
  activeTab: 'active',
  loading: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, loading: false };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

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
  const { user, loading: authLoading } = useAuth();

  // Load projects based on auth state
  useEffect(() => {
    if (authLoading) return;

    const fetchProjects = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (user) {
        try {
          // Fetch Projects
          const projectsQuery = query(
            collection(db, 'projects'), 
            where('userId', '==', user.uid)
          );
          const projectsSnapshot = await getDocs(projectsQuery);
          
          // Fetch Tasks
          const tasksQuery = query(
            collection(db, 'tasks'), 
            where('userId', '==', user.uid)
          );
          const tasksSnapshot = await getDocs(tasksQuery);
          
          const tasksByProject: Record<string, any[]> = {};
          tasksSnapshot.forEach(doc => {
            const data = doc.data();
            if (!tasksByProject[data.projectId]) {
              tasksByProject[data.projectId] = [];
            }
            tasksByProject[data.projectId].push(data);
          });

          const projects: Project[] = projectsSnapshot.docs.map(doc => {
            const data = doc.data();
            const projectTasks = tasksByProject[data.id] || [];
            
            return {
              id: data.id,
              name: data.name,
              description: data.description,
              completed: data.completed,
              createdAt: new Date(data.createdAt),
              completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
              priority: data.priority as Priority,
              startDate: data.startDate ? new Date(data.startDate) : undefined,
              endDate: data.endDate ? new Date(data.endDate) : undefined,
              tasks: projectTasks
                .sort((a: any, b: any) => a.order - b.order)
                .map((t: any) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  completed: t.completed,
                  order: t.order,
                })),
            };
          }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          dispatch({ type: 'SET_PROJECTS', payload: projects });
        } catch (error) {
          console.error('Error fetching projects:', error);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        // Load from local storage
        const savedProjects = loadProjects();
        dispatch({ type: 'SET_PROJECTS', payload: savedProjects });
      }
      
      // Set active project if none selected
      if (!state.activeProjectId) {
        const activeProject = state.projects.find(p => !p.completed);
        if (activeProject) {
          dispatch({ type: 'SET_ACTIVE_PROJECT', payload: activeProject.id });
        }
      }
    };

    fetchProjects();
  }, [user, authLoading]);

  // Save projects to localStorage ONLY if guest
  useEffect(() => {
    if (!user && !authLoading) {
      saveProjects(state.projects);
    }
  }, [state.projects, user, authLoading]);

  const dispatchWithSync = (action: Action) => {
    // Project limit check
    if (action.type === 'ADD_PROJECT') {
      const currentProjectCount = state.projects.length;
      const projectLimit = user ? PROJECT_LIMIT_LOGGED_IN : PROJECT_LIMIT_GUEST;
      
      if (currentProjectCount >= projectLimit) {
        const msg = user 
          ? `You have reached the limit of ${projectLimit} projects. Please upgrade to add more.`
          : `Guest users can only create ${projectLimit} projects. Please sign in to create up to ${PROJECT_LIMIT_LOGGED_IN} projects.`;
        alert(msg);
        throw new Error(msg);
      }
    }

    // Optimistic update
    dispatch(action);

    // Sync to Firebase if logged in
    if (user && !authLoading) {
      (async () => {
        try {
          switch (action.type) {
            case 'ADD_PROJECT': {
              const project = action.payload;
              const batch = writeBatch(db);
              
              const projectRef = doc(db, 'projects', project.id);
              batch.set(projectRef, {
                id: project.id,
                userId: user.uid,
                name: project.name,
                description: project.description,
                completed: project.completed,
                createdAt: project.createdAt.toISOString(),
                priority: project.priority || 'medium',
                startDate: project.startDate?.toISOString() || null,
                endDate: project.endDate?.toISOString() || null,
              });

              if (project.tasks.length > 0) {
                project.tasks.forEach(task => {
                  const taskRef = doc(db, 'tasks', task.id);
                  batch.set(taskRef, {
                    id: task.id,
                    projectId: project.id,
                    userId: user.uid,
                    title: task.title,
                    description: task.description,
                    completed: task.completed,
                    order: task.order,
                  });
                });
              }
              
              await batch.commit();
              break;
            }

            case 'DELETE_PROJECT':
              await deleteDoc(doc(db, 'projects', action.payload));
              // Note: Tasks are not automatically deleted in Firestore. 
              // In a real app, we should delete them too.
              break;

            case 'UPDATE_PROJECT': {
              const { projectId, updates } = action.payload;
              const dbUpdates: any = {};
              if (updates.name !== undefined) dbUpdates.name = updates.name;
              if (updates.description !== undefined) dbUpdates.description = updates.description;
              if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
              if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
              if (updates.startDate !== undefined) dbUpdates.startDate = updates.startDate?.toISOString() || null;
              if (updates.endDate !== undefined) dbUpdates.endDate = updates.endDate?.toISOString() || null;
              
              if (Object.keys(dbUpdates).length > 0) {
                await updateDoc(doc(db, 'projects', projectId), dbUpdates);
              }
              break;
            }

            case 'COMPLETE_TASK':
            case 'UNCOMPLETE_TASK': {
              const { taskId } = action.payload;
              const completed = action.type === 'COMPLETE_TASK';
              await updateDoc(doc(db, 'tasks', taskId), { completed });
              break;
            }

            case 'UPDATE_TASK': {
              const { taskId, updates } = action.payload;
              const dbUpdates: any = {};
              if (updates.title !== undefined) dbUpdates.title = updates.title;
              if (updates.description !== undefined) dbUpdates.description = updates.description;
              if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
              if (updates.order !== undefined) dbUpdates.order = updates.order;

              if (Object.keys(dbUpdates).length > 0) {
                await updateDoc(doc(db, 'tasks', taskId), dbUpdates);
              }
              break;
            }

            case 'REORDER_TASKS': {
              const { tasks } = action.payload;
              const batch = writeBatch(db);
              tasks.forEach(task => {
                const taskRef = doc(db, 'tasks', task.id);
                batch.update(taskRef, { order: task.order });
              });
              await batch.commit();
              break;
            }

            case 'COMPLETE_PROJECT':
              await updateDoc(doc(db, 'projects', action.payload), { 
                completed: true, 
                completedAt: new Date().toISOString() 
              });
              break;

            case 'REOPEN_PROJECT':
              await updateDoc(doc(db, 'projects', action.payload), { 
                completed: false, 
                completedAt: null 
              });
              break;
          }
        } catch (error) {
          console.error('Sync error:', error);
        }
      })();
    }
  };

  const activeProject = state.projects.find(p => p.id === state.activeProjectId);

  return (
    <AppContext.Provider value={{ state, dispatch: dispatchWithSync, activeProject }}>
      {children}
    </AppContext.Provider>
  );
}
