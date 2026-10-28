import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setResendMsg(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password, rememberMe);
      // Route based on authenticated server role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'worker') {
        navigate('/worker');
      } else {
        navigate('/citizen');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(detail);
      if (detail.toLowerCase().includes('not verified')) {
        setUnverified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setResending(true);
    setResendMsg(null);
    try {
      const res = await api.auth.resendVerification(email.trim());
      setResendMsg(res.message || 'A fresh verification email has been dispatched to your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const fillDemoCreds = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setUnverified(false);
    setResendMsg(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-pastel-border overflow-hidden grid md:grid-cols-2">
        
        {/* Left Form Area */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-pastel-forest">Official Portal</span>
              <h1 className="text-2xl font-bold text-pastel-charcoal dark:text-white">Welcome to Connectoo</h1>
            </div>
          </div>

          <p className="text-xs text-pastel-muted mb-6 leading-relaxed">
            Sign in to access your civic issue dashboard and view live resolution updates.
          </p>

          {/* Quick Demo Autofill Pills */}
          <div className="mb-6 p-3 rounded-2xl bg-pastel-mint/60 border border-pastel-sage">
            <p className="text-[11px] font-bold text-pastel-forest flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Quick Fill Demo Personas:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemoCreds('citizen@connectoo.gov', 'citizen123')}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-pastel-charcoal dark:text-slate-200 border border-pastel-sage hover:bg-pastel-mint transition-colors shadow-sm"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => fillDemoCreds('admin@connectoo.gov', 'admin123')}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-pastel-charcoal dark:text-slate-200 border border-pastel-sage hover:bg-pastel-mint transition-colors shadow-sm"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoCreds('worker.roads@connectoo.gov', 'worker123')}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-pastel-charcoal dark:text-slate-200 border border-pastel-sage hover:bg-pastel-mint transition-colors shadow-sm"
              >
                Worker
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-pastel-peach/60 border border-pastel-peach text-red-800 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
              {unverified && (
                <div className="pt-2 border-t border-red-200 flex items-center justify-between">
                  <span className="text-[11px]">Need a new link?</span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="font-bold text-pastel-forest hover:underline flex items-center gap-1 text-[11px]"
                  >
                    {resending && <RefreshCw className="w-3 h-3 animate-spin" />} Resend Verification
                  </button>
                </div>
              )}
            </div>
          )}

          {resendMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-pastel-mint border border-pastel-sage text-pastel-forest text-xs">
              {resendMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-pastel-forest hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-pastel-muted">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-pastel-border text-pastel-forest focus:ring-pastel-forest"
                />
                <span>Remember session (30 days)</span>
              </label>

              <Link
                to="/verify-email"
                className="text-[11px] text-pastel-muted hover:text-pastel-forest"
              >
                Verify email manually
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-pastel-border text-center text-xs text-pastel-muted">
            New to Connectoo?{' '}
            <Link to="/register" className="font-semibold text-pastel-forest hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        {/* Right Subtle Civic-Themed Visual Panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-pastel-mint/40 dark:bg-slate-800/50 border-l border-pastel-border relative">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-pastel-sage text-pastel-forest text-[11px] font-bold mb-4">
              Unified Municipal Portal
            </span>
            <h2 className="text-xl font-bold text-pastel-charcoal dark:text-white leading-snug">
              Connected Civic Infrastructure Management
            </h2>
            <p className="text-xs text-pastel-muted mt-3 leading-relaxed">
              One secure portal for citizens to register grievances, municipal staff to prioritize works, and field officers to verify physical resolutions.
            </p>
          </div>

          <div className="space-y-3 my-8">
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-pastel-border shadow-soft flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pastel-sky text-blue-800 flex items-center justify-center font-bold text-xs">
                GIS
              </div>
              <div>
                <p className="text-xs font-bold text-pastel-charcoal dark:text-white">Interactive City Map</p>
                <p className="text-[11px] text-pastel-muted">Pinpoint issues with precise GPS coordinates</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-pastel-border shadow-soft flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pastel-peach text-amber-800 flex items-center justify-center font-bold text-xs">
                SLA
              </div>
              <div>
                <p className="text-xs font-bold text-pastel-charcoal dark:text-white">Accountable Governance</p>
                <p className="text-[11px] text-pastel-muted">Transparent time-stamped audit trails</p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-pastel-muted flex items-center justify-between">
            <span>Official Connectoo System</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
