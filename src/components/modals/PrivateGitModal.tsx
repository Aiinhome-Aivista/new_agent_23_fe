import React, { useState } from 'react';
import { Lock, X, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';

interface PrivateGitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidated: (authenticatedUrl: string) => void;
  gitUrl: string;
}

export const PrivateGitModal: React.FC<PrivateGitModalProps> = ({
  isOpen,
  onClose,
  onValidated,
  gitUrl,
}) => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const getAuthenticatedGitUrl = (url: string, rawToken: string) => {
    if (!url) return '';
    // Clean existing authentication credentials if present
    const cleanUrl = url.trim().replace(/https?:\/\/([^@]+)@/, 'https://');
    if (cleanUrl.startsWith('https://')) {
      return cleanUrl.replace('https://', `https://${rawToken.trim()}@`);
    }
    return url;
  };

  const handleValidate = async () => {
    if (!token.trim()) {
      setErrorMsg('Please enter a Personal Access Token.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    const authenticatedUrl = getAuthenticatedGitUrl(gitUrl, token);

    try {
      const response = await api.post('/sessions/check-git-repo', {
        git_url: authenticatedUrl,
      });

      if (response.data.status === 'public') {
        // Authenticated URL was successfully accessed
        setSuccess(true);
        setTimeout(() => {
          onValidated(authenticatedUrl);
        }, 800);
      } else {
        setErrorMsg(response.data.message || 'Access denied. Please verify your token.');
      }
    } catch (err: any) {
      console.error('Validation error:', err);
      const msg = err.response?.data?.detail || 'Failed to authenticate. Please check the network connection.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-card border border-orange-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-5 border-b border-light-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/50 border border-orange-300 rounded-lg text-primary-orange shadow-xs">
              <Lock className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-card-foreground">
                Private Repository Access
              </h2>
              <p className="text-xs text-secondary-text mt-0.5">
                The repository is private and requires authentication credentials.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="text-secondary-text hover:text-card-foreground p-1 rounded-md transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-secondary-text leading-relaxed">
            Please provide a Git Personal Access Token (PAT) to clone this repository. The token will only be used to validate and clone the repository for test generation.
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-secondary-text">
              Personal Access Token (PAT)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-placeholder">
                <Key className="w-4 h-4 text-secondary-text" />
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="Paste token here..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading || success}
                className="w-full pl-9 pr-10 input-custom text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                disabled={loading || success}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-primary-text"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Help Info Box */}
          <div className="p-3 bg-input-bg border border-light-border rounded-lg space-y-1.5 text-[11px] text-secondary-text">
            <div className="font-semibold text-primary-text flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              How to get an Access Token:
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                <strong>GitHub:</strong> Settings &gt; Developer settings &gt; Personal Access Tokens &gt; Tokens (classic) &gt; Generate new token (scopes: <code className="bg-muted px-1 rounded">repo</code>).
              </li>
              <li>
                <strong>GitLab:</strong> User Settings &gt; Access Tokens &gt; Add new token (scopes: <code className="bg-muted px-1 rounded">read_repository</code> or <code className="bg-muted px-1 rounded">api</code>).
              </li>
            </ul>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 border border-orange-border bg-input-bg text-primary-orange text-xs rounded-md flex items-start gap-2 animate-in slide-in-from-top-1">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-all">{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3 border border-green-200 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs rounded-md flex items-center gap-2 animate-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Token validated successfully! Proceeding...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/60 border-t border-light-border flex items-center justify-end gap-3">
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={loading}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button 
            onClick={handleValidate}
            disabled={loading || success || !token.trim()}
            className="text-xs font-bold"
          >
            {loading ? 'Validating...' : 'Validate & Proceed'}
          </Button>
        </div>
      </div>
    </div>
  );
};
