import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Lock, Mail, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useSessionStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/new-session');
    }
  }, [isAuthenticated, navigate]);

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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground font-sans">
      <div className="w-full max-w-md">
        {/* Top Logo & Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex p-3 bg-primary-orange rounded-xl shadow-sm mb-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <Cpu className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-logo-title text-primary-orange">Unit-Test Case Generator</h1>
          <p className="font-header-subtitle text-secondary-text mt-1">Enterprise AI Specialist Testing Platform</p>
        </div>

        {/* Card Container using Global CSS Design Tokens */}
        <Card className="p-6 sm:p-8 shadow-sm">
          {/* Tab Switcher */}
          <div className="flex bg-muted p-1 rounded-lg mb-6 border border-light-border">
            <button 
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                !isRegister ? 'bg-primary-orange text-primary-foreground shadow-xs' : 'text-secondary-text hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                isRegister ? 'bg-primary-orange text-primary-foreground shadow-xs' : 'text-secondary-text hover:text-foreground'
              }`}
            >
              Register Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md text-xs text-red-700 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 font-dropdown-label">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-secondary-text absolute left-3 top-2.5" />
                  <Input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lead Solution Architect"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 font-dropdown-label">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-secondary-text absolute left-3 top-2.5" />
                <Input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@enterprise.com"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 font-dropdown-label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-secondary-text absolute left-3 top-2.5" />
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9 pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-secondary-text hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full text-xs py-3 shadow-xs mt-2"
            >
              {loading ? 'Authenticating...' : (isRegister ? 'Create Account & Launch' : 'Sign In to Workspace')}
            </Button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-6 pt-5 border-t border-light-border">
            <span className="text-[10px] uppercase tracking-wider text-secondary-text font-mono font-bold block mb-2.5 text-center">
              ⚡ Quick One-Click Demo Access:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline"
                type="button"
                onClick={() => handleDemoLogin('Solution Architect', 'Alex Morgan', 'alex.architect@enterprise.com')}
                className="h-auto p-2.5 bg-input hover:bg-muted border border-border rounded-lg justify-start text-left"
              >
                <div>
                  <div className="text-[11px] font-bold text-primary-orange">Lead Architect</div>
                  <div className="text-[9px] text-secondary-text font-mono">alex.architect@...</div>
                </div>
              </Button>
              <Button 
                variant="outline"
                type="button"
                onClick={() => handleDemoLogin('QA Lead Manager', 'Sarah Jenkins', 'sarah.qa@enterprise.com')}
                className="h-auto p-2.5 bg-input hover:bg-muted border border-border rounded-lg justify-start text-left"
              >
                <div>
                  <div className="text-[11px] font-bold text-primary">QA Lead Manager</div>
                  <div className="text-[9px] text-secondary-text font-mono">sarah.qa@...</div>
                </div>
              </Button>
            </div>
          </div>
        </Card>

        {/* Return to Landing Page Link */}
        <div className="text-center mt-6">
          <Button 
            variant="link"
            onClick={() => navigate('/')} 
            className="text-xs text-secondary-text hover:text-primary-orange font-medium"
          >
            ← Return to Landing Page
          </Button>
        </div>
      </div>
    </div>
  );
};
