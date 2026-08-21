import React from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { sessionId, user, isAuthenticated, logout } = useSessionStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-light-border bg-card text-card-foreground transition-colors duration-200 shadow-2xs">
      <div className="flex items-center gap-3">
        <div>
          <h1 
            className="font-logo-title text-primary-orange cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2" 
            onClick={() => navigate('/')}
          >
            Unit-Test Case Generator Agent
          </h1>
          <p className="font-header-subtitle text-secondary-text text-xs mt-0.5">High-Level Requirement-Driven AI Testing Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-muted text-secondary-text transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {sessionId && (
          <div className="bg-input border border-border-orange px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-mono text-xs font-bold text-foreground">Session: {sessionId.slice(0, 8)}...</span>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="flex items-center gap-3 border-l border-light-border pl-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-primary-text leading-tight">{user.name}</div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-secondary-text hover:text-red-500 hover:bg-input rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
