import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TechProfile } from '../types';

interface SessionState {
  sessionId: string | null;
  currentStep: number;
  techProfile: TechProfile | null;
  setSessionId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  setTechProfile: (profile: TechProfile) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      currentStep: 1,
      techProfile: null,
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
