import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  // Auto-verify if query params are present
  useEffect(() => {
    if (tokenParam && emailParam) {
      handleVerification(tokenParam, emailParam);
    }
  }, [tokenParam, emailParam]);

  const handleVerification = async (verifyToken: string, verifyEmailAddress: string) => {
    if (!verifyToken.trim() || !verifyEmailAddress.trim()) {
      setError('Please provide both the email address and verification token.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await verifyEmail(verifyToken.trim(), verifyEmailAddress.trim());
      setSuccess(res.message || 'Your email has been verified successfully!');
      setTimeout(() => {
        navigate('/citizen');
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your registered email address to resend the verification link.');
      return;
    }
    setResending(true);
    setResendMsg(null);
    setError(null);

    try {
      const res = await api.auth.resendVerification(email.trim());
      setResendMsg(res.message || 'A fresh verification email has been sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-pastel-border overflow-hidden grid md:grid-cols-2">
        
        {/* Left Form Area */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-pastel-forest">Security Verification</span>
              <h1 className="text-2xl font-bold text-pastel-charcoal dark:text-white">Verify Your Email</h1>
            </div>
          </div>

          {success ? (
            <div className="p-6 rounded-2xl bg-pastel-mint border border-pastel-sage text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-pastel-forest mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-pastel-forest">Verification Complete!</h3>
                <p className="text-xs text-pastel-muted mt-1">{success}</p>
              </div>
              <p className="text-xs text-slate-500">Redirecting to your dashboard in a few seconds...</p>
              <Link
                to="/citizen"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pastel-forest text-white font-semibold text-xs shadow-soft hover:bg-civic-600 transition-colors"
              >
                Go to Dashboard Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-pastel-muted leading-relaxed">
                Click the button below to confirm your email address and activate your citizen account.
              </p>

              {error && (
                <div className="p-3.5 rounded-xl bg-pastel-peach/60 border border-pastel-peach text-red-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold">Verification Issue</p>
                    <p className="text-[11px] mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {resendMsg && (
                <div className="p-3.5 rounded-xl bg-pastel-mint border border-pastel-sage text-pastel-forest text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resendMsg}</span>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleVerification(token, email); }} className="space-y-4">
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
                      placeholder="citizen@example.com"
                      className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                    Verification Token
                  </label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste verification token from your email"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Email...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Confirm & Activate Account
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-pastel-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-pastel-muted">Didn't receive an email?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold text-pastel-forest hover:underline flex items-center gap-1.5"
                >
                  {resending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Resend Verification Email
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Subtle Civic-Themed Visual Panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-pastel-mint/50 dark:bg-slate-800/50 border-l border-pastel-border relative">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-pastel-sage text-pastel-forest text-[11px] font-bold mb-4">
              Community Trust & Governance
            </span>
            <h2 className="text-xl font-bold text-pastel-charcoal dark:text-white leading-snug">
              Ensuring Verified, Authentic Civic Engagement
            </h2>
            <p className="text-xs text-pastel-muted mt-3 leading-relaxed">
              Email verification prevents spam reports, protects citizen privacy, and allows municipal departments to send real-time progress updates directly to you.
            </p>
          </div>

          <div className="space-y-3 my-8">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-pastel-border shadow-soft flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pastel-sky text-blue-800 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-pastel-charcoal dark:text-white">Confirm Citizen Identity</p>
                <p className="text-[11px] text-pastel-muted">Legitimate communication with city engineers</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-pastel-border shadow-soft flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pastel-peach text-amber-800 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <p className="text-xs font-bold text-pastel-charcoal dark:text-white">Receive SLA Notifications</p>
                <p className="text-[11px] text-pastel-muted">Real-time alerts when repair work commences</p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-pastel-muted flex items-center justify-between">
            <span>Already verified? <Link to="/login" className="font-semibold text-pastel-forest hover:underline">Sign In</Link></span>
            <span>Connectoo &copy; {new Date().getFullYear()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
