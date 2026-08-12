import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { NewSessionView } from './views/NewSessionView';
import { UploadArtifactsView } from './views/UploadArtifactsView';
import { DecompositionReviewView } from './views/DecompositionReviewView';
import { AgentExecutionView } from './views/AgentExecutionView';
import { WorkspaceView } from './views/WorkspaceView';
import { HistoryView } from './views/HistoryView';

function App() {
  return (
    <Router>
      <Routes>
        {/* Full Screen Public Landing & Authentication Views */}
        <Route path="/" element={<LandingView />} />
        <Route path="/login" element={<LoginView />} />

        {/* Application Inner Workspace Routes Wrapped in MainLayout */}
        <Route 
          path="/new-session" 
          element={
            <MainLayout>
              <NewSessionView />
            </MainLayout>
          } 
        />
        <Route 
          path="/history" 
          element={
            <MainLayout>
              <HistoryView />
            </MainLayout>
          } 
        />
        <Route 
          path="/session/:id/upload" 
          element={
            <MainLayout>
              <UploadArtifactsView />
            </MainLayout>
          } 
        />
        <Route 
          path="/session/:id/decomposition" 
          element={
            <MainLayout>
              <DecompositionReviewView />
            </MainLayout>
          } 
        />
        <Route 
          path="/session/:id/executing" 
          element={
            <MainLayout>
              <AgentExecutionView />
            </MainLayout>
          } 
        />
        <Route 
          path="/session/:id/workspace" 
          element={
            <MainLayout>
              <WorkspaceView />
            </MainLayout>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
