import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<boolean>(false);
  const [regMessage, setRegMessage] = useState<string>('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });

      if (res && res.requires_verification) {
        setRegMessage(res.message || 'Account created! Please check your email inbox to verify your account.');
        setRegisteredSuccess(true);
      } else {
        // Direct login if verification policy permits
        navigate('/citizen');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please verify your details.');
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-pastel-forest">Citizen Portal</span>
              <h1 className="text-2xl font-bold text-pastel-charcoal dark:text-white">Create Citizen Account</h1>
            </div>
          </div>

          <p className="text-xs text-pastel-muted mb-6 leading-relaxed">
            Register to report municipal problems, track repair progress in real time, and verify community works.
          </p>

          {registeredSuccess ? (
            <div className="p-6 rounded-2xl bg-pastel-mint border border-pastel-sage space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-pastel-forest mx-auto" />
              <div>
                <h3 className="text-base font-bold text-pastel-forest">Verification Email Sent</h3>
                <p className="text-xs text-pastel-muted mt-1 leading-relaxed">
                  {regMessage}
                </p>
              </div>
              <div className="p-3 bg-white/70 rounded-xl border border-pastel-sage text-[11px] text-pastel-charcoal">
                We sent a secure activation link to <strong>{email}</strong>. Please click the link in your email to activate your account.
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(email)}`}
                  className="w-full py-2.5 rounded-xl bg-pastel-forest text-white font-bold text-xs shadow-soft hover:bg-civic-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  Enter Verification Code Manually <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="text-xs text-pastel-forest font-semibold hover:underline mt-1"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-pastel-peach/60 border border-pastel-peach text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                  />
                </div>
              </div>

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
                    placeholder="priya.sharma@example.com"
                    className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                  Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pastel-charcoal dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 dark:bg-slate-800 text-pastel-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-pastel-forest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-pastel-muted">
                Staff & Field Worker accounts are provisioned directly by Municipal Administrators.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Creating Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-pastel-border text-center text-xs text-pastel-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-pastel-forest hover:underline">
              Sign In
            </Link>
          </div>
        </div>

        {/* Right Subtle Civic-Themed Visual Panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-pastel-mint/40 dark:bg-slate-800/50 border-l border-pastel-border relative">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-pastel-sage text-pastel-forest text-[11px] font-bold mb-4">
              Citizen-Powered Cities
            </span>
            <h2 className="text-xl font-bold text-pastel-charcoal dark:text-white leading-snug">
              Every Report Shapes a Better Neighborhood
            </h2>
            <p className="text-xs text-pastel-muted mt-3 leading-relaxed">
              Join thousands of residents transforming public infrastructure. Report potholes, streetlights, and sanitation issues in under 30 seconds with automated AI triage.
            </p>
          </div>

          <div className="space-y-3 my-6">
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-pastel-border shadow-soft flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <p className="text-xs font-bold text-pastel-charcoal dark:text-white">Smart Classification</p>
                <p className="text-[11px] text-pastel-muted">Auto-routes to the exact responsible department</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-pastel-border shadow-soft flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pastel-sky text-blue-800 flex items-center justify-center font-bold text-xs">
                SLA
              </div>
              <div>
                <p className="text-xs font-bold text-pastel-charcoal dark:text-white">Guaranteed Deadlines</p>
                <p className="text-[11px] text-pastel-muted">Automated escalation for overdue issues</p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-pastel-muted flex items-center justify-between">
            <span>Connectoo Municipal Platform</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
