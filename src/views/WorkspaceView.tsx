import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Download, Settings2, X } from 'lucide-react';
import api from '../services/api';

export const WorkspaceView: React.FC = () => {
  const { id } = useParams();
  const [code, setCode] = useState('// Generating test cases...\n');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDownloadZip = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/sessions/${id}/download/zip`, '_blank');
  };

  const handleDownloadReport = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/sessions/${id}/download/report`, '_blank');
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/sessions/${id}/review/resolve`, {
        feedback: feedback
      });
      setIsModalOpen(false);
      setFeedback('');
      // In a real app, we might trigger a re-generation or show a success toast here
      alert("Feedback saved! AI will regenerate tests based on your instructions.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col h-[calc(100vh-120px)] relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-main-heading">Test Review Workspace</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-orange flex items-center gap-2 bg-white text-text-primary border border-light-border hover:bg-gray-50"
          >
            <Settings2 className="w-4 h-4" /> Resolve Ambiguities
          </button>
          <button onClick={handleDownloadReport} className="btn-orange flex items-center gap-2">
            <Download className="w-4 h-4" /> Word Report
          </button>
          <button onClick={handleDownloadZip} className="btn-orange flex items-center gap-2">
            <Download className="w-4 h-4" /> Export ZIP
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Sidebar: Matrix & Files */}
        <div className="w-1/3 bg-white border border-light-border rounded flex flex-col overflow-hidden">
          <div className="p-3 border-b border-light-border bg-input-bg">
            <h3 className="font-dropdown-label text-text-primary font-bold">Traceability Matrix</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                <span>UserServiceTest.java</span>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">COVERED</span>
              </li>
              <li className="flex justify-between items-center p-2 hover:bg-red-50 rounded cursor-pointer border border-red-200 bg-red-50">
                <span>AuthServiceTest.java</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">AMBIGUOUS</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Sidebar: Monaco Editor */}
        <div className="flex-1 border border-light-border rounded overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="java"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Resolve Ambiguities Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-light-border">
            <div className="flex justify-between items-center p-4 border-b border-light-border bg-input-bg">
              <h3 className="font-bold text-text-primary">Resolve Ambiguities (Human-in-the-Loop)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
                <p className="text-sm text-yellow-800 font-semibold mb-1">AI Agent Question:</p>
                <p className="text-sm text-yellow-900">"The requirement states 'Block user after multiple failed attempts', but it does not specify how many attempts. Please clarify."</p>
              </div>
              
              <label className="block font-dropdown-label mb-2">Your Instruction:</label>
              <textarea
                className="w-full input-custom min-h-[100px] text-sm"
                placeholder="e.g. Block the user after 3 failed attempts."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            
            <div className="p-4 border-t border-light-border bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-text-primary border border-light-border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !feedback.trim()}
                className="btn-orange disabled:opacity-50 text-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit to AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
