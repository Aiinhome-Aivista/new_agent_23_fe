import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { NewSessionView } from './views/NewSessionView';
import { UploadArtifactsView } from './views/UploadArtifactsView';
import { DecompositionReviewView } from './views/DecompositionReviewView';
import { AgentExecutionView } from './views/AgentExecutionView';
import { WorkspaceView } from './views/WorkspaceView';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/new-session" replace />} />
          <Route path="/new-session" element={<NewSessionView />} />
          <Route path="/session/:id/upload" element={<UploadArtifactsView />} />
          <Route path="/session/:id/decomposition" element={<DecompositionReviewView />} />
          <Route path="/session/:id/executing" element={<AgentExecutionView />} />
          <Route path="/session/:id/workspace" element={<WorkspaceView />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
