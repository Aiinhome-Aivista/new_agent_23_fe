import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TechProfile } from '../types';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface SessionState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  sessionId: string | null;
  currentStep: number;
  techProfile: TechProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  setSessionId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  setTechProfile: (profile: TechProfile) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: {
        name: 'Lead Solution Architect',
        email: 'architect@enterprise.com',
        role: 'Enterprise Architect',
      },
      isAuthenticated: true,
      sessionId: null,
      currentStep: 1,
      techProfile: null,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, sessionId: null, currentStep: 1 }),
      setSessionId: (id) => set({ sessionId: id }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setTechProfile: (profile) => set({ techProfile: profile }),
      resetSession: () => set({ sessionId: null, currentStep: 1, techProfile: null }),
    }),
    {
      name: 'agent-session-storage',
    }
  )
);
