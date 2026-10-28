import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ArrowRight } from 'lucide-react';
import api from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !email.trim()) {
      setError('Missing reset token or email address. Please request a new link.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and re-type.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.resetPassword({
        token: token.trim(),
        email: email.trim(),
        new_password: newPassword,
      });
      setSuccess(res.message || 'Password has been successfully updated.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-pastel-border overflow-hidden grid md:grid-cols-2">
        
        {/* Left Form Area */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-pastel-forest">Account Security</span>
              <h1 className="text-2xl font-bold text-pastel-charcoal dark:text-white">Choose New Password</h1>
            </div>
          </div>

          <p className="text-xs text-pastel-muted mb-6 leading-relaxed">
            Please enter your new password below. Make sure it is at least 6 characters long.
          </p>

          {success ? (
            <div className="p-6 rounded-2xl bg-pastel-mint border border-pastel-sage text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-pastel-forest mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-pastel-forest">Password Updated!</h3>
                <p className="text-xs text-pastel-muted mt-1">{success}</p>
              </div>
              <p className="text-xs text-slate-500">Redirecting to login in a moment...</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pastel-forest text-white font-semibold text-xs shadow-soft hover:bg-civic-600 transition-colors"
              >
                Sign In Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-pastel-peach/60 border border-pastel-peach text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token from email"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Updating Password...
                  </>
                ) : (
                  'Save New Password'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-4 border-t border-pastel-border text-center text-xs text-pastel-muted">
            <Link to="/login" className="font-semibold text-pastel-forest hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>

        {/* Right Subtle Civic-Themed Visual Panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-pastel-mint/50 dark:bg-slate-800/50 border-l border-pastel-border relative">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-pastel-sage text-pastel-forest text-[11px] font-bold mb-4">
              Password Hygiene
            </span>
            <h2 className="text-xl font-bold text-pastel-charcoal dark:text-white leading-snug">
              Protect Your Municipal Service Portal
            </h2>
            <p className="text-xs text-pastel-muted mt-3 leading-relaxed">
              Your Connectoo account protects your reported civic complaints, home coordinates, and verified resolution feedback.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-pastel-border shadow-soft space-y-2">
            <p className="text-xs font-bold text-pastel-charcoal dark:text-white">Recommendations</p>
            <ul className="text-[11px] text-pastel-muted space-y-1.5 list-disc pl-4">
              <li>Use a combination of letters, numbers, and symbols</li>
              <li>Avoid reusing passwords across personal sites</li>
              <li>Keep your verification email confidential</li>
            </ul>
          </div>

          <div className="text-[11px] text-pastel-muted flex items-center justify-between">
            <span>Connectoo – AI-Powered Civic Management System</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
