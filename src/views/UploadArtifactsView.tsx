import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { UploadCloud, CheckCircle2, GitBranch, FolderOpen, Settings2 } from 'lucide-react';
import api from '../services/api';

export const UploadArtifactsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStep } = useSessionStore();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Git Configuration State
  const [gitUrl, setGitUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('');
  const [gitPath, setGitPath] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDecompose = async () => {
    if (!id) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      // Loop over files and upload via FormData
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/sessions/${id}/artifacts`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploadedCount(i + 1);
      }
      
      // Trigger background decomposition & agent graph with Git metadata
      await api.post(`/sessions/${id}/decompose`, {
        git_url: gitUrl.trim() || null,
        git_branch: gitBranch.trim() || null,
        git_path: gitPath.trim() || null
      });
      
      setCurrentStep(3);
      navigate(`/session/${id}/decomposition`);
    } catch (error: any) {
      console.error("Artifact upload/decomposition error:", error);
      const backendError = error.response?.data?.detail || "Failed to validate Git Repository URL or authentication token. Please verify.";
      setErrorMsg(backendError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card rounded shadow-sm border border-light-border p-8 mt-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="font-main-heading mb-2">Upload Requirement & Specification Artifacts</h2>
        <p className="text-sm text-secondary-text">
          Provide your sprint/story artifacts along with your Git repository to let the AI formulate business rules and generate target unit tests.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 text-sm rounded-md shadow-sm">
          {errorMsg}
        </div>
      )}
      
      {/* Sprint/Story Upload Section */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-orange-border bg-input-bg' : 'border-light-border hover:border-orange-border'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 mx-auto text-primary-orange mb-4" />
        <p className="font-instruction-text font-semibold">
          {isDragActive ? "Drop files here..." : "Drag & drop sprint / story files here, or click to browse"}
        </p>
        <p className="text-xs text-placeholder mt-2">
          Supports BRD (.md, .txt, .docx), API Specifications (.json, .yaml), and Database Schemas (.sql)
        </p>
      </div>

      {files.length > 0 && (
        <div>
          <h3 className="font-dropdown-label mb-3 font-semibold text-primary-text">Queued Requirement Artifacts ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, i) => (
              <li key={i} className="flex justify-between items-center p-3 border border-light-border rounded bg-input-bg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-chat-input text-sm font-medium text-primary-text">{file.name}</span>
                </div>
                <span className="text-placeholder text-xs font-mono">{(file.size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Git Connection Section */}
      <div className="border border-light-border rounded-lg p-6 bg-card shadow-sm">
        <h3 className="font-dropdown-label text-md font-semibold text-primary-text mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary-orange" />
          Connect Git Repository (Optional)
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-secondary-text mb-1">Git Repository URL</label>
            <input
              type="text"
              placeholder="e.g. https://github.com/username/project-repository.git"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              className="w-full input-custom text-sm"
            />
            <p className="text-xs text-placeholder mt-1">
              For private repos, use format: <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">https://&lt;token&gt;@github.com/user/repo.git</code>
            </p>
          </div>

          <button 
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="flex items-center gap-1.5 text-xs font-medium text-primary-orange hover:text-hover-orange transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-light-border">
              <div>
                <label className="block text-xs font-semibold text-secondary-text mb-1">Target Branch</label>
                <input
                  type="text"
                  placeholder="e.g. main or master"
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                  className="w-full input-custom text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-text mb-1 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5" /> Subdirectory Path (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. src/main/java"
                  value={gitPath}
                  onChange={(e) => setGitPath(e.target.value)}
                  className="w-full input-custom text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Submit Section */}
      <div className="pt-4 flex justify-between items-center border-t border-light-border">
        <span className="text-xs text-secondary-text">
          {uploading ? `Processing file ${uploadedCount} of ${files.length}...` : `${files.length} file(s) ready for decomposition.`}
        </span>
        <button 
          onClick={handleDecompose} 
          disabled={(files.length === 0 && !gitUrl) || uploading} 
          className="btn-orange disabled:opacity-50"
        >
          {uploading ? 'Parsing & Decomposing...' : 'Start Decomposition Pipeline'}
        </button>
      </div>
    </div>
  );
};
