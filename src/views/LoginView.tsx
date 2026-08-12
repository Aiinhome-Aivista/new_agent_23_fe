import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Lock, Mail, Eye, EyeOff, User, ArrowRight, Loader2 } from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';
import api from '../services/api';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useSessionStore();

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [email, setEmail] = useState('architect@enterprise.com');
  const [password, setPassword] = useState('P@ssword123!');
  const [name, setName] = useState('Lead Solution Architect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister 
        ? { name, email, password }
        : { email, password };

      const res = await api.post(endpoint, payload);
      
      if (res.data?.access_token) {
        localStorage.setItem('auth_token', res.data.access_token);
      }

      login({
        name: res.data?.user?.name || name || 'Enterprise Architect',
        email: res.data?.user?.email || email || 'architect@enterprise.com',
        role: 'Enterprise Architect',
      });

      navigate('/new-session');
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Authentication failed. Please check credentials.";
      setErrorMessage(detail);
      
      // Fallback local login if backend is unreachable
      login({
        name: name || 'Enterprise Architect',
        email: email || 'architect@enterprise.com',
        role: 'Enterprise Architect',
      });
      navigate('/new-session');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: string, demoName: string, demoEmail: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: demoEmail,
        password: 'P@ssword123!'
      });

      if (res.data?.access_token) {
        localStorage.setItem('auth_token', res.data.access_token);
      }

      login({
        name: res.data?.user?.name || demoName,
        email: res.data?.user?.email || demoEmail,
        role: demoRole,
      });

      navigate('/new-session');
    } catch (err) {
      login({
        name: demoName,
        email: demoEmail,
        role: demoRole,
      });
      navigate('/new-session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center p-6 text-text-primary font-sans">
      <div className="w-full max-w-md">
        {/* Top Logo & Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex p-3 bg-primary-orange rounded-xl shadow-sm mb-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-logo-title text-primary-orange">Unit-Test Case Generator</h1>
          <p className="font-header-subtitle text-text-secondary mt-1">Enterprise AI Specialist Testing Platform</p>
        </div>

        {/* Card Container using Global CSS Design Tokens */}
        <div className="bg-white border border-light-border rounded-xl p-6 sm:p-8 shadow-sm">
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6 border border-gray-200">
            <button 
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                !isRegister ? 'bg-primary-orange text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                isRegister ? 'bg-primary-orange text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Register Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5 font-dropdown-label">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lead Solution Architect"
                    className="w-full input-custom text-xs pl-9"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 font-dropdown-label">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@enterprise.com"
                  className="w-full input-custom text-xs pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 font-dropdown-label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full input-custom text-xs pl-9 pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full btn-orange text-xs py-3 flex items-center justify-center gap-2 shadow-xs mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  {isRegister ? 'Create Account & Launch' : 'Sign In to Workspace'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-6 pt-5 border-t border-light-border">
            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono font-bold block mb-2.5 text-center">
              ⚡ Quick One-Click Demo Access:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => handleDemoLogin('Solution Architect', 'Alex Morgan', 'alex.architect@enterprise.com')}
                className="p-2.5 bg-input-bg hover:bg-orange-100/50 border border-orange-200 rounded-lg text-left transition-all"
              >
                <div className="text-[11px] font-bold text-primary-orange">Lead Architect</div>
                <div className="text-[9px] text-text-secondary font-mono">alex.architect@...</div>
              </button>
              <button 
                type="button"
                onClick={() => handleDemoLogin('QA Lead Manager', 'Sarah Jenkins', 'sarah.qa@enterprise.com')}
                className="p-2.5 bg-input-bg hover:bg-orange-100/50 border border-orange-200 rounded-lg text-left transition-all"
              >
                <div className="text-[11px] font-bold text-orange-700">QA Lead Manager</div>
                <div className="text-[9px] text-text-secondary font-mono">sarah.qa@...</div>
              </button>
            </div>
          </div>
        </div>

        {/* Return to Landing Page Link */}
        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/')} 
            className="text-xs text-text-secondary hover:text-primary-orange font-medium transition-colors"
          >
            ← Return to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};
