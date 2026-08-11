import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

export const Header: React.FC = () => {
  const { sessionId } = useSessionStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-light-border bg-white">
      <div>
        <h1 className="font-logo-title text-primary-orange">Unit-Test Case Generator Agent</h1>
        <p className="font-header-subtitle text-text-secondary mt-1">AI-Powered Enterprise Testing Assistant</p>
      </div>
      <div className="flex items-center gap-4">
        {sessionId && (
          <div className="bg-input-bg border border-orange-border px-3 py-1 rounded-full">
            <span className="font-question-pill text-text-primary">Session: {sessionId.slice(0, 8)}...</span>
          </div>
        )}
        <button className="p-2 text-text-secondary hover:text-primary-orange transition-colors">
          <Sun className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
