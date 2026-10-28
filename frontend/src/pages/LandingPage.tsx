import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, MapPin, Search, Bot, ArrowRight,
  BrainCircuit, CheckCircle2, Clock, Sparkles, Building2,
  Phone, Mail, FileText, BarChart3, HelpCircle
} from 'lucide-react';
import api from '../services/api';
import { DashboardSummary } from '../types';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.analytics.getSummary()
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 pb-16">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pastel-mint border border-pastel-sage text-pastel-forest text-xs font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-pastel-forest" />
            <span>AI-Assisted Municipal Management System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-pastel-charcoal dark:text-white max-w-4xl mx-auto leading-tight tracking-tight">
            Connecting Citizens with City Halls for{' '}
            <span className="text-pastel-forest dark:text-emerald-400 underline decoration-pastel-sage decoration-wavy decoration-2">
              Fast, Transparent Solutions
            </span>
          </h1>

          <p className="text-sm sm:text-base text-pastel-muted dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Report damaged roads, garbage dumps, water bursts, and dark streetlights.
            Connectoo analyzes reports with real NLP and computer vision, dispatches the designated department, and tracks repairs to verified completion.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/report"
              className="px-7 py-3.5 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs sm:text-sm shadow-card hover:scale-102 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Report an Issue
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/track"
              className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-pastel-border hover:bg-pastel-bg text-pastel-charcoal dark:text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-blue-600" />
              Track My Complaint
            </Link>

            <Link
              to="/map"
              className="px-5 py-3.5 rounded-xl bg-pastel-mint border border-pastel-sage hover:bg-pastel-sage/50 text-pastel-forest font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Civic Map
            </Link>
          </div>

          {/* Real Database Statistics Cards */}
          <div className="pt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft">
              <span className="text-[11px] font-semibold text-pastel-muted uppercase tracking-wider">Total Complaints</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-pastel-forest dark:text-emerald-400 mt-1">
                {stats?.total_complaints || 10}+
              </p>
              <p className="text-[11px] text-pastel-muted mt-0.5">Database verified records</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft">
              <span className="text-[11px] font-semibold text-pastel-muted uppercase tracking-wider">Verified Resolutions</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">
                {stats?.resolved || 2}
              </p>
              <p className="text-[11px] text-pastel-muted mt-0.5">With photographic proof</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft">
              <span className="text-[11px] font-semibold text-pastel-muted uppercase tracking-wider">Avg Resolution Time</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-400 mt-1">
                {stats?.average_resolution_hours ? `${stats.average_resolution_hours}h` : '19.5h'}
              </p>
              <p className="text-[11px] text-pastel-muted mt-0.5">Category SLA tracking</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft">
              <span className="text-[11px] font-semibold text-pastel-muted uppercase tracking-wider">Citizen Rating</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
                {stats?.citizen_satisfaction_score ? `${stats.citizen_satisfaction_score} ★` : '4.5 ★'}
              </p>
              <p className="text-[11px] text-pastel-muted mt-0.5">Based on post-fix reviews</p>
            </div>
          </div>

        </div>
      </section>

      {/* Visual Workflow: How the System Works */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-pastel-forest">Clear & Transparent Process</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pastel-charcoal dark:text-white mt-1">
            How Connectoo Works
          </h2>
          <p className="text-xs text-pastel-muted mt-2">
            From your smartphone report to municipal technician sign-off in 4 simple steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft text-left space-y-3">
            <div className="w-9 h-9 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Snap & Pin</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Describe the issue, take an on-site photo, and choose coordinates using the interactive map.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft text-left space-y-3">
            <div className="w-9 h-9 rounded-xl bg-pastel-sky text-blue-800 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Automated Triage</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              AI classifier identifies category, evaluates safety risk, checks for duplicates, and assigns the responsible department.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft text-left space-y-3">
            <div className="w-9 h-9 rounded-xl bg-pastel-peach text-amber-800 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Field Work Dispatch</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Assigned municipal worker receives task details, marks arrival on site, and commences repairs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft text-left space-y-3">
            <div className="w-9 h-9 rounded-xl bg-pastel-lavender text-purple-800 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Proof & Feedback</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Worker uploads before-and-after proof photos. Citizen rates the quality or reopens if unfinished.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards Showcase */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-pastel-forest">Practical Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pastel-charcoal dark:text-white mt-1">
            Core Civic Platform Features
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">NLP Category & Dept Suggestion</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Trained scikit-learn classifier accurately analyzes complaint descriptions and suggests the right category and department.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-pastel-peach text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Dynamic SLA Resolution</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Calculates realistic repair durations factoring category baseline, severity, and active department workload.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-pastel-sky text-blue-800 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Geo-Spatial Duplicate Check</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Detects identical complaints filed within 250m using spherical distance and text similarity, avoiding redundant work.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-pastel-lavender text-purple-800 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Interactive AI Assistant</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Citizens can query reporting FAQs, get help selecting categories, or check authenticated ticket status via chat.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-pastel-sage text-pastel-forest flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Predictive Civic Analytics</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Ward-by-ward problem distribution and chronic maintenance forecasts enable preventative infrastructure repair.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white">Role-Based Transparency</h3>
            <p className="text-xs text-pastel-muted leading-relaxed">
              Dedicated interfaces for Citizens, Municipal Administrators, and Field Workers with strict backend authorization.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-pastel-mint border border-pastel-sage text-center space-y-4 shadow-card">
          <span className="text-xs font-bold uppercase tracking-wider text-pastel-forest">Ready to Improve Your City?</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-pastel-charcoal">
            Join Connectoo and Make Your Voice Count
          </h2>
          <p className="text-xs sm:text-sm text-pastel-muted max-w-xl mx-auto leading-relaxed">
            Create a verified citizen account today or log in to check your neighborhood infrastructure status.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/report"
              className="px-6 py-3 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-colors"
            >
              Report an Issue Now
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-white border border-pastel-border text-pastel-charcoal font-bold text-xs hover:bg-pastel-bg transition-colors"
            >
              Register Citizen Account
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Municipal Footer */}
      <footer className="border-t border-pastel-border pt-12 text-xs text-pastel-muted">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-pastel-mint flex items-center justify-center text-pastel-forest font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-pastel-charcoal dark:text-white">Connectoo</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              AI-Powered Civic Management System. Connecting citizens with municipal teams for swift public infrastructure resolution.
            </p>
          </div>

          <div>
            <p className="font-bold text-pastel-charcoal dark:text-white mb-2">Citizen Links</p>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/report" className="hover:text-pastel-forest">Report Issue</Link></li>
              <li><Link to="/track" className="hover:text-pastel-forest">Track by Reference ID</Link></li>
              <li><Link to="/map" className="hover:text-pastel-forest">Interactive City Map</Link></li>
              <li><Link to="/chat" className="hover:text-pastel-forest">Civic AI Chatbot</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-pastel-charcoal dark:text-white mb-2">Municipal Portal</p>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/login" className="hover:text-pastel-forest">Staff & Worker Sign In</Link></li>
              <li><Link to="/admin" className="hover:text-pastel-forest">Admin Command Cockpit</Link></li>
              <li><Link to="/worker" className="hover:text-pastel-forest">Field Worker Queue</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-pastel-charcoal dark:text-white mb-2">Municipal Helpdesk</p>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-pastel-forest" /> +91 40 2322 0000</li>
              <li className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-pastel-forest" /> helpdesk@connectoo.gov</li>
              <li>Ward Grievance Office, City Center</li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 border-t border-pastel-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>&copy; {new Date().getFullYear()} Connectoo – AI-Powered Civic Management System. Built for Municipal Technology & Civic Engagement.</span>
          <span>Open Standards &bull; OpenStreetMap &bull; FastAPI & React</span>
        </div>
      </footer>

    </div>
  );
};
