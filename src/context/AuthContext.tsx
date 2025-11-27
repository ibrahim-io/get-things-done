import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { loadProjects } from '../services/storage';
import type { Project } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // Migration Logic: If user just signed in and has local projects, upload them
      if (user) {
        const localProjects = loadProjects();
        if (localProjects.length > 0) {
          await migrateLocalData(user.uid, localProjects);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const migrateLocalData = async (userId: string, projects: Project[]) => {
    try {
      const batch = writeBatch(db);
      
      for (const project of projects) {
        // Create Project Ref
        const projectDocRef = doc(db, 'projects', project.id);

        batch.set(projectDocRef, {
          id: project.id,
          userId: userId,
          name: project.name,
          description: project.description,
          completed: project.completed,
          createdAt: project.createdAt.toISOString(),
          completedAt: project.completedAt?.toISOString() || null,
          priority: project.priority || 'medium',
          startDate: project.startDate?.toISOString() || null,
          endDate: project.endDate?.toISOString() || null,
        });

        // Upload Tasks
        if (project.tasks.length > 0) {
          for (const task of project.tasks) {
            const taskDocRef = doc(db, 'tasks', task.id);
            batch.set(taskDocRef, {
              id: task.id,
              projectId: project.id,
              userId: userId,
              title: task.title,
              description: task.description,
              completed: task.completed,
              order: task.order,
            });
          }
        }
      }

      await batch.commit();

      // Clear local storage after successful migration
      localStorage.removeItem('gtd_projects');
      console.log('Local data migrated to cloud successfully');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
