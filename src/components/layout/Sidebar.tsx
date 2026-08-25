import React from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { CheckCircle, Circle, PlayCircle, History, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const steps = [
  { id: 1, label: 'Profile Setup', path: '/new-session' },
  { id: 2, label: 'Artifact Upload', path: '/session/:id/upload' },
  { id: 3, label: 'Decomposition', path: '/session/:id/decomposition' },
  { id: 4, label: 'Agent Execution', path: '/session/:id/executing' },
  { id: 5, label: 'Workspace', path: '/session/:id/workspace' },
];

export const Sidebar: React.FC = () => {
  const { currentStep, sessionId, isAuthenticated, logout } = useSessionStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isHistory = location.pathname === '/history';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStepClick = (stepId: number, path: string) => {
    if (stepId === 1) {
      navigate(path);
    } else if (sessionId && stepId <= currentStep) {
      navigate(path.replace(':id', sessionId));
    }
  };

  return (
    <aside className="w-64 bg-sidebar text-primary-foreground flex flex-col pt-8 border-r border-light-border">
      <div className="px-6 flex-1">
        <h2 className="font-main-heading mb-6 text-xs uppercase tracking-wider text-placeholder">Generation Pipeline</h2>
        <ul className="space-y-6">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep || (step.id === 5 && currentStep === 5);
            const isCurrent = step.id === currentStep && !isHistory;
            const isClickable = step.id === 1 || (sessionId && step.id <= currentStep);

            return (
              <li 
                key={step.id} 
                className={`flex items-center gap-3 transition-opacity ${isClickable ? 'cursor-pointer opacity-90 hover:opacity-100' : 'opacity-50 cursor-not-allowed'}`}
                onClick={() => isClickable && handleStepClick(step.id, step.path)}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-primary-orange" />
                ) : isCurrent ? (
                  <PlayCircle className="w-5 h-5 text-button-orange" />
                ) : (
                  <Circle className="w-5 h-5 text-secondary-text" />
                )}
                <span className={`font-dropdown-label text-sm ${isCurrent ? 'text-primary-foreground font-bold' : 'text-placeholder'}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-6 pb-8 space-y-3">
        <h2 className="font-main-heading mb-2 text-xs uppercase tracking-wider text-placeholder">Navigation</h2>
        
        <button 
          onClick={() => navigate('/history')} 
          className={`flex items-center gap-3 w-full opacity-90 hover:opacity-100 transition-opacity ${isHistory ? 'text-primary-foreground font-bold' : 'text-placeholder'}`}
        >
          <History className={`w-5 h-5 ${isHistory ? 'text-primary-orange' : 'text-secondary-text'}`} />
          <span className="font-dropdown-label text-sm">Session History</span>
        </button>

        {isAuthenticated && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full opacity-90 hover:opacity-100 hover:text-red-400 transition-colors text-placeholder px-4 py-2 rounded-[10px] border border-light-border"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-dropdown-label text-sm">Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
};
