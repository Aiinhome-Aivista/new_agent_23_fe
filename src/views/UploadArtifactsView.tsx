import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { UploadCloud, CheckCircle2, GitBranch, FolderOpen, Settings2, FileText, Plus } from 'lucide-react';
import api from '../services/api';

interface JiraTicket {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
}

export const UploadArtifactsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStep } = useSessionStore();
  const [files, setFiles] = useState<File[]>([]);
  const [existingArtifacts, setExistingArtifacts] = useState<{ filename: string; file_type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Jira State
  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [jiraUrl, setJiraUrl] = useState(() => localStorage.getItem('jiraUrl') || '');
  const [jiraEmail, setJiraEmail] = useState(() => localStorage.getItem('jiraEmail') || '');
  const [jiraToken, setJiraToken] = useState(() => localStorage.getItem('jiraToken') || '');
  const [jiraProject, setJiraProject] = useState(() => localStorage.getItem('jiraProject') || '');
  const [jiraStatus, setJiraStatus] = useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    localStorage.setItem('jiraUrl', jiraUrl);
    localStorage.setItem('jiraEmail', jiraEmail);
    localStorage.setItem('jiraToken', jiraToken);
    localStorage.setItem('jiraProject', jiraProject);
  }, [jiraUrl, jiraEmail, jiraToken, jiraProject]);

  const fetchTickets = async () => {
    let correctedUrl = jiraUrl.trim();
    // Auto-correct common typos in Atlassian domain
    if (correctedUrl.includes('.atlasian.')) {
      correctedUrl = correctedUrl.replace('.atlasian.', '.atlassian.');
    }
    if (correctedUrl.endsWith('.atlassian.com')) {
      correctedUrl = correctedUrl.replace('.atlassian.com', '.atlassian.net');
    }
    
    // Update state if we corrected it so the user sees the fix
    if (correctedUrl !== jiraUrl) {
      setJiraUrl(correctedUrl);
    }

    if (!correctedUrl || !jiraEmail || !jiraToken || !jiraProject) {
      setErrorMsg("Please provide Jira URL, Project Name, Email, and API Token to connect.");
      setJiraStatus('error');
      return;
    }
    
    setLoadingTickets(true);
    setJiraStatus('idle');
    setErrorMsg(null);
    try {
      const response = await api.post('/jira/tickets', {
        url: correctedUrl,
        email: jiraEmail,
        token: jiraToken,
        jql: `project="${jiraProject}" AND statusCategory != "Done" ORDER BY updated DESC`
      });
      setJiraTickets(response.data.tickets || []);
      setJiraStatus('success');
    } catch (err: any) {
      console.error("Failed to connect to Jira:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to connect to Jira. Check your credentials.");
      setJiraStatus('error');
    } finally {
      setLoadingTickets(false);
    }
  };

  React.useEffect(() => {
    if (jiraUrl && jiraEmail && jiraToken && jiraProject) {
      fetchTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const fetchSessionData = async () => {
      if (!id) return;
      try {
        const response = await api.get(`/sessions/${id}`);
        const { tech_profile, artifacts } = response.data;
        if (tech_profile) {
          if (tech_profile.git_url) setGitUrl(tech_profile.git_url);
          if (tech_profile.git_branch) setGitBranch(tech_profile.git_branch);
          if (tech_profile.git_path) setGitPath(tech_profile.git_path);
        }
        if (artifacts) {
          setExistingArtifacts(artifacts);
        }
      } catch (err) {
        console.error("Failed to load session details:", err);
      }
    };
    fetchSessionData();
  }, [id]);

  const handleSelectTicket = (ticket: JiraTicket) => {
    // Check if already added in current run or previously uploaded
    if (files.some(f => f.name === `${ticket.id}.json`) || existingArtifacts.some(a => a.filename === `${ticket.id}.json`)) return;

    const fileContent = JSON.stringify(ticket, null, 2);
    const file = new File([fileContent], `${ticket.id}.json`, { type: 'application/json' });
    setFiles(prev => [...prev, file]);
  };

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

      {existingArtifacts.length > 0 && (
        <div className="mt-4">
          <h3 className="font-dropdown-label mb-3 font-semibold text-primary-text flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary-orange" />
            Previously Uploaded Artifacts ({existingArtifacts.length})
          </h3>
          <ul className="space-y-2">
            {existingArtifacts.map((art, i) => (
              <li key={i} className="flex justify-between items-center p-3 border border-light-border rounded bg-card shadow-2xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-orange" />
                  <span className="font-chat-input text-sm font-medium text-primary-text">{art.filename}</span>
                </div>
                <span className="text-placeholder text-xs font-mono capitalize px-2 py-0.5 border border-light-border rounded-full bg-input-bg">{art.file_type.toLowerCase().replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Jira Tickets Section */}
      <div className="border border-light-border rounded-lg p-6 bg-card shadow-sm">
        <h3 className="font-dropdown-label text-md font-semibold text-primary-text mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Connect Jira & Sync Tickets
          {jiraStatus === 'success' && <span className="ml-2 flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 border border-green-300 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
          {jiraStatus === 'error' && <span className="ml-2 flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">Connection Failed</span>}
        </h3>
        
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary-text mb-1">Jira Instance URL</label>
              <input
                type="text"
                placeholder="e.g. https://your-domain.atlassian.net"
                value={jiraUrl}
                onChange={(e) => setJiraUrl(e.target.value)}
                className="w-full input-custom text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary-text mb-1">Project Name (or Key)</label>
              <input
                type="text"
                placeholder="e.g. PROJ or My Project"
                value={jiraProject}
                onChange={(e) => setJiraProject(e.target.value)}
                className="w-full input-custom text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary-text mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. your-email@company.com"
                value={jiraEmail}
                onChange={(e) => setJiraEmail(e.target.value)}
                className="w-full input-custom text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary-text mb-1">API Token</label>
              <input
                type="password"
                placeholder="Your Jira API Token"
                value={jiraToken}
                onChange={(e) => setJiraToken(e.target.value)}
                className="w-full input-custom text-sm"
              />
            </div>
          </div>
          <button 
            type="button" 
            onClick={fetchTickets}
            disabled={loadingTickets}
            className="btn-outline border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
          >
            {loadingTickets ? 'Connecting & Syncing...' : 'Connect'}
          </button>
        </div>

        {loadingTickets ? (
          <p className="text-sm text-secondary-text">Fetching tickets from Jira...</p>
        ) : jiraTickets.length > 0 ? (
          <div className="space-y-3">
            {jiraTickets.map(ticket => {
              const isSelected = files.some(f => f.name === `${ticket.id}.json`) || existingArtifacts.some(a => a.filename === `${ticket.id}.json`);
              return (
                <div key={ticket.id} className={`flex justify-between items-start p-4 border rounded transition-colors ${isSelected ? 'border-orange-300 bg-[#FFEFE6]' : 'border-light-border bg-input-bg hover:border-orange-300'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-orange-100 text-primary-orange px-2 py-0.5 rounded">{ticket.id}</span>
                      <span className="text-xs font-semibold text-gray-500 border border-gray-200 px-2 py-0.5 rounded">{ticket.type}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-primary-text">{ticket.title}</h4>
                    <p className="text-xs text-secondary-text mt-1 line-clamp-2">{ticket.description}</p>
                  </div>
                  <button
                    onClick={() => handleSelectTicket(ticket)}
                    disabled={isSelected}
                    className={`shrink-0 ml-4 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded transition-colors ${isSelected ? 'bg-orange-100/80 text-primary-orange cursor-not-allowed' : 'bg-orange-50 text-primary-orange hover:bg-orange-100'}`}
                  >
                    {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary-text">No Jira tickets available.</p>
        )}
      </div>

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
