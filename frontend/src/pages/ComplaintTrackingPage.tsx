import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, ShieldAlert, Clock, CheckCircle2, MapPin,
  Calendar, Building2, Wrench, AlertCircle, ArrowRight
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import api from '../services/api';

export const ComplaintTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [complaintIdInput, setComplaintIdInput] = useState(searchParams.get('id') || '');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.complaints.track(code.trim().toUpperCase());
      setComplaint(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || `No complaint found for ID "${code}". Please check your ticket number.`);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      setComplaintIdInput(idFromQuery);
      fetchTracking(idFromQuery);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(complaintIdInput);
  };

  const steps: ComplaintStatus[] = [
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Closed'
  ];

  const getStepIndex = (status: ComplaintStatus) => {
    if (status === 'Reopened') return 3;
    if (status === 'Escalated') return 3;
    if (status === 'Rejected') return -1;
    return steps.indexOf(status);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Search Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold">
          <Search className="w-3.5 h-3.5" />
          <span>Real-time Issue Tracker</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Track Your Civic Complaint
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your unique complaint ID (e.g., <code className="font-mono font-bold text-emerald-600">CIV-2026-00101</code>) to check live technician assignment and expected resolution deadline.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={complaintIdInput}
              onChange={(e) => setComplaintIdInput(e.target.value)}
              placeholder="e.g. CIV-2026-00101"
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !complaintIdInput.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {complaint && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-8 animate-in fade-in">
          
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {complaint.complaint_id}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {complaint.status}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {complaint.priority} Priority
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {complaint.title}
              </h2>
            </div>

            <Link
              to={`/complaints/${complaint.id}`}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 shrink-0"
            >
              Full Timeline & Discussion <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Visual Step Progress Bar */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Resolution Progress Milestones
            </h3>
            
            <div className="relative">
              {/* Progress Line */}
              <div className="hidden sm:block absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
              
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
                {steps.map((st, idx) => {
                  const currentIdx = getStepIndex(complaint.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = complaint.status === st;

                  return (
                    <div key={st} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors mb-2 ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <span className={`text-xs font-semibold ${isCurrent ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ticket Information Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Department Assigned</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {complaint.department_name || 'Designated Municipal Dept'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Target SLA Completion</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                {complaint.expected_resolution_at
                  ? new Date(complaint.expected_resolution_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Under Triage'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Field Officer</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-purple-600" />
                {complaint.assigned_worker_name || 'Pending Worker Dispatch'}
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
