import React from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { CheckCircle, Circle, PlayCircle } from 'lucide-react';

const steps = [
  { id: 1, label: 'Profile Setup' },
  { id: 2, label: 'Artifact Upload' },
  { id: 3, label: 'Decomposition' },
  { id: 4, label: 'Agent Execution' },
  { id: 5, label: 'Workspace' },
];

export const Sidebar: React.FC = () => {
  const { currentStep } = useSessionStore();

  return (
    <aside className="w-64 bg-sidebar-custom text-white flex flex-col pt-8">
      <div className="px-6 flex-1">
        <h2 className="font-main-heading mb-6">Workflow</h2>
        <ul className="space-y-6">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep || (step.id === 5 && currentStep === 5);
            const isCurrent = step.id === currentStep;

            return (
              <li key={step.id} className="flex items-center gap-3">
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
    </aside>
  );
};
