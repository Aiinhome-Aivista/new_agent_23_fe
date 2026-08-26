import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { UploadCloud, CheckCircle2, GitBranch, FolderOpen, Settings2, FileText, Plus, Eye, EyeOff, Cpu, Check, X, Globe, Mail } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { PrivateGitModal } from '../components/modals/PrivateGitModal';
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
  const [jiraUrl, setJiraUrl] = useState(() => {
    const val = localStorage.getItem(`jiraUrl_${id}`);
    return val !== null ? val : (localStorage.getItem('jiraUrl') || '');
  });
  const [jiraEmail, setJiraEmail] = useState(() => {
    const val = localStorage.getItem(`jiraEmail_${id}`);
    return val !== null ? val : (localStorage.getItem('jiraEmail') || '');
  });
  const [jiraToken, setJiraToken] = useState(() => {
    const val = localStorage.getItem(`jiraToken_${id}`);
    return val !== null ? val : (localStorage.getItem('jiraToken') || '');
  });
  const [jiraProject, setJiraProject] = useState(() => {
    const val = localStorage.getItem(`jiraProject_${id}`);
    return val !== null ? val : (localStorage.getItem('jiraProject') || '');
  });
  const [jiraStatus, setJiraStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showJiraToken, setShowJiraToken] = useState(false);

  React.useEffect(() => {
    if (!id) return;
    localStorage.setItem(`jiraUrl_${id}`, jiraUrl);
    localStorage.setItem(`jiraEmail_${id}`, jiraEmail);
    localStorage.setItem(`jiraToken_${id}`, jiraToken);
    localStorage.setItem(`jiraProject_${id}`, jiraProject);

    if (jiraUrl && jiraEmail && jiraToken && jiraProject) {
      localStorage.setItem('jiraUrl', jiraUrl);
      localStorage.setItem('jiraEmail', jiraEmail);
      localStorage.setItem('jiraToken', jiraToken);
      localStorage.setItem('jiraProject', jiraProject);
    }
  }, [jiraUrl, jiraEmail, jiraToken, jiraProject, id]);

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

  const handleDisconnect = () => {
    // Remove files created from Jira tickets
    setFiles(prev => prev.filter(f => !jiraTickets.some(t => f.name === `${t.id}.json`)));
    
    // Reset credentials and states
    setJiraUrl('');
    setJiraEmail('');
    setJiraToken('');
    setJiraProject('');
    setJiraTickets([]);
    setJiraStatus('idle');
  };

  React.useEffect(() => {
    if (jiraUrl && jiraEmail && jiraToken && jiraProject) {
      fetchTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [techProfile, setTechProfile] = useState<any>({ language: 'Java', framework: 'JUnit 5', mockLibrary: 'Mockito' });
  const [showEditStack, setShowEditStack] = useState(false);
  const [tempLang, setTempLang] = useState('Java');
  const [tempFramework, setTempFramework] = useState('JUnit 5');
  const [tempMock, setTempMock] = useState('Mockito');

  const STACK_OPTIONS: Record<string, { frameworks: string[]; mocks: string[] }> = {
    Java: { frameworks: ['JUnit 5', 'JUnit 4', 'TestNG'], mocks: ['Mockito', 'EasyMock'] },
    Python: { frameworks: ['Pytest', 'unittest'], mocks: ['pytest-mock', 'unittest.mock'] },
    TypeScript: { frameworks: ['Jest', 'Vitest', 'Mocha'], mocks: ['Jest Mock', 'Sinon'] },
    JavaScript: { frameworks: ['Jest', 'Mocha'], mocks: ['Sinon', 'Jest Mock'] },
    'C#': { frameworks: ['xUnit', 'NUnit', 'MSTest'], mocks: ['Moq', 'NSubstitute'] },
    Go: { frameworks: ['testing', 'Ginkgo'], mocks: ['testify', 'gomock'] }
  };

  const handleLangSelect = (lang: string) => {
    setTempLang(lang);
    const opts = STACK_OPTIONS[lang] || { frameworks: ['Unit Test'], mocks: ['Mock Library'] };
    setTempFramework(opts.frameworks[0] || 'Unit Test');
    setTempMock(opts.mocks[0] || 'Mock Library');
  };

  const handleSaveStack = async () => {
    try {
      const updated = { language: tempLang, framework: tempFramework, mockLibrary: tempMock };
      await api.put(`/sessions/${id}/tech-profile`, updated);
      setTechProfile(updated);
      setShowEditStack(false);
    } catch (err) {
      console.error("Failed to update stack:", err);
    }
  };

  React.useEffect(() => {
    const fetchSessionData = async () => {
      if (!id) return;
      try {
        const response = await api.get(`/sessions/${id}`);
        const { tech_profile, artifacts } = response.data;
        if (tech_profile) {
          setTechProfile(tech_profile);
          setTempLang(tech_profile.language || 'Java');
          setTempFramework(tech_profile.framework || 'JUnit 5');
          setTempMock(tech_profile.mockLibrary || 'Mockito');
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
    // Check if already in existingArtifacts (cannot unselect from UI without backend call)
    if (existingArtifacts.some(a => a.filename === `${ticket.id}.json`)) return;

    const isFileSelected = files.some(f => f.name === `${ticket.id}.json`);
    
    if (isFileSelected) {
      setFiles(prev => prev.filter(f => f.name !== `${ticket.id}.json`));
    } else {
      const fileContent = JSON.stringify(ticket, null, 2);
      const file = new File([fileContent], `${ticket.id}.json`, { type: 'application/json' });
      setFiles(prev => [...prev, file]);
    }
  };

  // Git Configuration State
  const [gitUrl, setGitUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('');
  const [gitPath, setGitPath] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const proceedDecompose = async (validatedGitUrl?: string) => {
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
      
      const finalGitUrl = validatedGitUrl || gitUrl.trim();

      // Trigger background decomposition & agent graph with Git metadata
      await api.post(`/sessions/${id}/decompose`, {
        git_url: finalGitUrl || null,
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

  const handleDecompose = async () => {
    if (!gitUrl.trim()) {
      await proceedDecompose();
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/sessions/check-git-repo', {
        git_url: gitUrl.trim(),
      });

      if (response.data.status === 'public') {
        await proceedDecompose();
      } else if (response.data.status === 'private') {
        setUploading(false);
        setShowPrivateModal(true);
      } else {
        setErrorMsg(response.data.message || 'Failed to validate Git Repository URL.');
        setUploading(false);
      }
    } catch (error: any) {
      console.error("Git check error:", error);
      const backendError = error.response?.data?.detail || "Failed to connect to the Git Repository URL. Please verify.";
      setErrorMsg(backendError);
      setUploading(false);
    }
  };

  return (
    <Card className="p-8 mt-10 max-w-4xl mx-auto space-y-8 border-light-border shadow-sm">
      <CardHeader className="p-0">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <CardTitle className="font-main-heading text-2xl mb-2">Upload Requirement & Specification Artifacts</CardTitle>
            <CardDescription className="text-sm text-secondary-text">
              Provide your sprint/story artifacts along with your Git repository to let the AI formulate business rules and generate target unit tests.
            </CardDescription>
          </div>
          
          {/* Target Stack Indicator Pill */}
          <div className="flex items-center gap-2 bg-input-bg border border-light-border px-3 py-1.5 rounded-lg text-xs font-medium text-primary-text shadow-2xs">
            <Cpu className="w-4 h-4 text-primary-orange" />
            <span>Target: <strong>{techProfile?.language || 'Java'}</strong> ({techProfile?.framework || 'JUnit 5'})</span>
            <button
              type="button"
              onClick={() => setShowEditStack(!showEditStack)}
              className="text-primary-orange font-bold hover:underline ml-1"
            >
              [Change Stack]
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Inline Stack Switcher Dialog */}
      {showEditStack && (
        <div className="p-4 bg-orange-500/5 dark:bg-orange-950/20 border-2 border-primary-orange/60 rounded-lg shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-card-foreground flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-primary-orange" />
              Adjust Target Language & Framework Settings
            </h4>
            <button onClick={() => setShowEditStack(false)} className="text-secondary-text hover:text-card-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-secondary-text mb-1">Target Language</label>
              <select
                value={tempLang}
                onChange={(e) => handleLangSelect(e.target.value)}
                className="w-full bg-card border border-light-border rounded p-1.5 text-xs text-card-foreground"
              >
                {Object.keys(STACK_OPTIONS).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-secondary-text mb-1">Testing Framework</label>
              <select
                value={tempFramework}
                onChange={(e) => setTempFramework(e.target.value)}
                className="w-full bg-card border border-light-border rounded p-1.5 text-xs text-card-foreground"
              >
                {(STACK_OPTIONS[tempLang]?.frameworks || ['Unit Test']).map(fw => (
                  <option key={fw} value={fw}>{fw}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-secondary-text mb-1">Mocking Library</label>
              <select
                value={tempMock}
                onChange={(e) => setTempMock(e.target.value)}
                className="w-full bg-card border border-light-border rounded p-1.5 text-xs text-card-foreground"
              >
                {(STACK_OPTIONS[tempLang]?.mocks || ['Mock Library']).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={() => setShowEditStack(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveStack} className="text-xs flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Save Stack Profile
            </Button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 border border-orange-border bg-input-bg text-primary-orange text-sm rounded-md shadow-sm break-all">
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
                  <CheckCircle2 className="w-4 h-4 text-primary-orange" />
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
          <FileText className="w-5 h-5 text-primary-orange" />
          Connect Jira & Sync Tickets
          {jiraStatus === 'success' && <span className="ml-2 flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 border border-green-300 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
          {jiraStatus === 'error' && <span className="ml-2 flex items-center gap-1 text-[11px] font-bold text-primary-orange bg-input-bg border border-orange-border px-2 py-0.5 rounded-full">Connection Failed</span>}
        </h3>
        
        {jiraStatus === 'success' ? (
          <div className="bg-card border border-light-border border-l-4 border-l-green-500 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-xs mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-900/50 animate-pulse">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <h4 className="font-bold text-sm text-primary-text">Connected to Jira</h4>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 px-2 py-0.5 rounded-full">
                    Active Session
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 text-xs text-secondary-text font-mono mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-placeholder font-sans w-32 shrink-0 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-placeholder" />
                      Instance URL:
                    </span> 
                    <span className="text-primary-text font-semibold break-all bg-muted/60 dark:bg-muted/30 px-2.5 py-1 rounded-md border border-light-border shadow-3xs">{jiraUrl.replace(/^https?:\/\//, '').split('/')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-placeholder font-sans w-32 shrink-0 flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-placeholder" />
                      Project Key:
                    </span> 
                    <span className="text-primary-text font-semibold break-all bg-muted/60 dark:bg-muted/30 px-2.5 py-1 rounded-md border border-light-border shadow-3xs">{jiraProject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-placeholder font-sans w-32 shrink-0 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-placeholder" />
                      Connected User:
                    </span> 
                    <span className="text-primary-text font-semibold break-all bg-muted/60 dark:bg-muted/30 px-2.5 py-1 rounded-md border border-light-border shadow-3xs">{jiraEmail}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex sm:flex-row md:flex-row items-center gap-2.5 self-end md:self-center w-full md:w-auto justify-end">
              <Button 
                type="button" 
                onClick={fetchTickets}
                disabled={loadingTickets}
                className="text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm hover:opacity-95"
              >
                <Cpu className="w-3.5 h-3.5 animate-spin" style={{ display: loadingTickets ? 'inline' : 'none' }} />
                {loadingTickets ? 'Syncing...' : 'Sync Tickets'}
              </Button>
              <Button
                type="button"
                onClick={handleDisconnect}
                className="text-xs px-4 py-2 shadow-sm hover:opacity-95"
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary-text mb-1">Jira Instance URL</label>
                <Input
                  type="text"
                  placeholder="e.g. https://your-domain.atlassian.net"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-text mb-1">Project Name (or Key)</label>
                <Input
                  type="text"
                  placeholder="e.g. PROJ or My Project"
                  value={jiraProject}
                  onChange={(e) => setJiraProject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-text mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. your-email@company.com"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-text mb-1">API Token</label>
                <div className="relative">
                  <Input
                    type={showJiraToken ? "text" : "password"}
                    placeholder="Your Jira API Token"
                    value={jiraToken}
                    onChange={(e) => setJiraToken(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowJiraToken(!showJiraToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-primary-text"
                  >
                    {showJiraToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                onClick={fetchTickets}
                disabled={loadingTickets}
              >
                {loadingTickets ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        )}

        {loadingTickets ? (
          <p className="text-sm text-secondary-text">Fetching tickets from Jira...</p>
        ) : jiraTickets.length > 0 ? (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
            {jiraTickets.map(ticket => {
              const isSelected = files.some(f => f.name === `${ticket.id}.json`) || existingArtifacts.some(a => a.filename === `${ticket.id}.json`);
              return (
                <div key={ticket.id} className={`flex justify-between items-start p-4 border rounded transition-colors ${isSelected ? 'border-orange-border bg-input-bg' : 'border-light-border bg-card hover:border-orange-border'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-input-bg border border-orange-border text-primary-orange px-2 py-0.5 rounded">{ticket.id}</span>
                      <span className="text-xs font-semibold text-secondary-text border border-light-border px-2 py-0.5 rounded">{ticket.type}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-primary-text">{ticket.title}</h4>
                    <p className="text-xs text-secondary-text mt-1 line-clamp-2">{ticket.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectTicket(ticket)}
                    disabled={existingArtifacts.some(a => a.filename === `${ticket.id}.json`)}
                    className="shrink-0 ml-4"
                    leftIcon={isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : jiraStatus === 'success' ? (
          <p className="text-sm text-secondary-text">No active Jira tickets found for this project.</p>
        ) : null}
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
      <CardFooter className="pt-4 px-0 pb-0 flex justify-between items-center border-t border-light-border">
        <span className="text-xs text-secondary-text">
          {uploading ? `Processing file ${uploadedCount} of ${files.length}...` : `${files.length} file(s) ready for decomposition.`}
        </span>
        <Button 
          onClick={handleDecompose} 
          disabled={(files.length === 0 && !gitUrl) || uploading} 
          className="uppercase font-bold"
        >
          {uploading ? 'Parsing & Decomposing...' : 'Start Decomposition Pipeline'}
        </Button>
      </CardFooter>
      <PrivateGitModal
        isOpen={showPrivateModal}
        onClose={() => setShowPrivateModal(false)}
        gitUrl={gitUrl}
        onValidated={async (authUrl) => {
          setShowPrivateModal(false);
          setGitUrl(authUrl);
          await proceedDecompose(authUrl);
        }}
      />
    </Card>
  );
};
