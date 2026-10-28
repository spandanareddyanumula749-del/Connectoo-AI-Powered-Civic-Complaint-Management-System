import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.forgotPassword(email.trim());
      setMessage(res.message || 'If an account exists with this email address, password reset instructions have been sent.');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while requesting a password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-pastel-border overflow-hidden grid md:grid-cols-2">
        
        {/* Left Form Area */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-pastel-muted hover:text-pastel-forest mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pastel-lavender text-purple-800 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-pastel-forest">Account Security</span>
              <h1 className="text-2xl font-bold text-pastel-charcoal dark:text-white">Forgot Password?</h1>
            </div>
          </div>

          <p className="text-xs text-pastel-muted mb-6 leading-relaxed">
            Enter the email address associated with your Connectoo account. We will dispatch a secure link to reset your password.
          </p>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-pastel-mint border border-pastel-sage space-y-3">
              <div className="flex items-center gap-2 text-pastel-forest font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Check Your Email</span>
              </div>
              <p className="text-xs text-pastel-muted leading-relaxed">
                {message}
              </p>
              <div className="pt-3 border-t border-pastel-sage flex items-center justify-between text-xs">
                <span className="text-pastel-muted">Didn't get an email?</span>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="font-bold text-pastel-forest hover:underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-pastel-peach/60 border border-pastel-peach text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending Reset Link...
                  </>
                ) : (
                  'Send Password Reset Instructions'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-4 border-t border-pastel-border text-center text-xs text-pastel-muted">
            Remember your credentials?{' '}
            <Link to="/login" className="font-semibold text-pastel-forest hover:underline">
              Sign In here
            </Link>
          </div>
        </div>

        {/* Right Subtle Civic-Themed Visual Panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-pastel-lavender/40 dark:bg-slate-800/50 border-l border-pastel-border relative">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-pastel-lavender text-purple-900 text-[11px] font-bold mb-4">
              Cryptographic Safeguards
            </span>
            <h2 className="text-xl font-bold text-pastel-charcoal dark:text-white leading-snug">
              Protected Access to Municipal Data
            </h2>
            <p className="text-xs text-pastel-muted mt-3 leading-relaxed">
              Connectoo generates single-use, time-limited cryptographic tokens for password recovery. Links expire after 60 minutes for your protection.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-pastel-border shadow-soft space-y-2">
            <p className="text-xs font-bold text-pastel-charcoal dark:text-white">Security Checklist</p>
            <ul className="text-[11px] text-pastel-muted space-y-1.5 list-disc pl-4">
              <li>Reset tokens are invalid once used</li>
              <li>Passwords are salted and hashed with bcrypt</li>
              <li>Session tokens expire on password updates</li>
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
