import React from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { CheckCircle, Circle, PlayCircle, History } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const steps = [
  { id: 1, label: 'Profile Setup', path: '/new-session' },
  { id: 2, label: 'Artifact Upload', path: '/session/:id/upload' },
  { id: 3, label: 'Decomposition', path: '/session/:id/decomposition' },
  { id: 4, label: 'Agent Execution', path: '/session/:id/executing' },
  { id: 5, label: 'Workspace', path: '/session/:id/workspace' },
];

export const Sidebar: React.FC = () => {
  const { currentStep, sessionId } = useSessionStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isHistory = location.pathname === '/history';

  const handleStepClick = (stepId: number, path: string) => {
    if (stepId === 1) {
      navigate(path);
    } else if (sessionId && stepId <= currentStep) {
      navigate(path.replace(':id', sessionId));
    }
  };

  return (
    <aside className="w-64 bg-sidebar-custom text-white flex flex-col pt-8">
      <div className="px-6 flex-1">
        <h2 className="font-main-heading mb-6">Workflow</h2>
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
                  <Circle className="w-5 h-5 text-text-secondary" />
                )}
                <span className={`font-dropdown-label ${isCurrent ? 'text-white font-bold' : 'text-text-placeholder'}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="px-6 pb-8">
        <h2 className="font-main-heading mb-4 text-text-secondary">Navigation</h2>
        <button 
          onClick={() => navigate('/history')} 
          className={`flex items-center gap-3 w-full opacity-90 hover:opacity-100 transition-opacity ${isHistory ? 'text-white font-bold' : 'text-text-placeholder'}`}
        >
          <History className={`w-5 h-5 ${isHistory ? 'text-primary-orange' : 'text-text-secondary'}`} />
          <span className="font-dropdown-label">Session History</span>
        </button>
      </div>
    </aside>
  );
};
