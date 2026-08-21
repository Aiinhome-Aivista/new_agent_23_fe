import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { useAgentStream } from '../hooks/useAgentStream';
import { Terminal } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const AgentExecutionView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStep } = useSessionStore();
  const { logs, isStreaming } = useAgentStream(id || null);

  const handleProceed = () => {
    setCurrentStep(5);
    navigate(`/session/${id}/workspace`);
  };

  return (
    <Card className="mt-6 flex flex-col h-[calc(100vh-140px)] overflow-hidden shadow-sm border-light-border">
      <div className="bg-muted px-4 py-3 flex justify-between items-center border-b border-light-border">
        <div className="flex items-center gap-2 text-primary-foreground">
          <Terminal className="w-5 h-5 text-button-orange" />
          <span className="font-bold">Agent Execution Terminal</span>
          {isStreaming && <span className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
        </div>
        <Button size="sm" onClick={handleProceed} className="text-xs">
          Skip to Workspace
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-[#A9B7C6] whitespace-pre-wrap">
        {logs.length === 0 ? (
          <p className="text-placeholder italic">Waiting for agent traces...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </Card>
  );
};
