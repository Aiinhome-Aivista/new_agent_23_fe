import React from 'react';
import { LogOut } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { sessionId, user, isAuthenticated, logout } = useSessionStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-light-border bg-white shadow-2xs">
      <div className="flex items-center gap-3">
        <div>
          <h1 
            className="font-logo-title text-primary-orange cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2" 
            onClick={() => navigate('/')}
          >
            Unit-Test Case Generator Agent
          </h1>
          <p className="font-header-subtitle text-text-secondary text-xs mt-0.5">High-Level Requirement-Driven AI Testing Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {sessionId && (
          <div className="bg-orange-50 border border-orange-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-mono text-xs font-bold text-orange-950">Session: {sessionId.slice(0, 8)}...</span>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-text-primary leading-tight">{user.name}</div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
