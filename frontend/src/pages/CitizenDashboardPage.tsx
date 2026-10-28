import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Search, Clock, CheckCircle2, AlertTriangle, RotateCcw,
  MapPin, Calendar, ArrowRight, MessageSquare, Star, ExternalLink, ShieldCheck,
  Edit3, Trash2, X, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Complaint } from '../types';
import api from '../services/api';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawingComplaint, setWithdrawingComplaint] = useState<Complaint | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const fetchMyComplaints = async () => {
    try {
      const data = await api.complaints.getMyComplaints();
      setComplaints(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const total = complaints.length;
  const active = complaints.filter(c => ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Escalated'].includes(c.status)).length;
  const resolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
  const reopened = complaints.filter(c => c.status === 'Reopened').length;

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-pastel-peach text-red-900 border-red-300';
      case 'High': return 'bg-pastel-peach/70 text-orange-900 border-orange-200';
      case 'Medium': return 'bg-pastel-sky text-blue-900 border-blue-200';
      default: return 'bg-pastel-mint text-pastel-forest border-pastel-sage';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'bg-pastel-mint text-pastel-forest border border-pastel-sage';
      case 'In Progress':
        return 'bg-pastel-lavender text-purple-900 border border-purple-200';
      case 'Escalated':
        return 'bg-pastel-peach text-red-900 border border-red-200';
      case 'Reopened':
        return 'bg-amber-100 text-amber-900 border border-amber-200';
      default:
        return 'bg-pastel-bg text-pastel-charcoal border border-pastel-border';
    }
  };

  const openEditModal = (c: Complaint) => {
    setEditingComplaint(c);
    setEditTitle(c.title);
    setEditDescription(c.description);
    setEditLandmark(c.landmark || '');
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;
    setEditLoading(true);
    setEditError(null);

    try {
      await api.complaints.update(editingComplaint.id, {
        title: editTitle,
        description: editDescription,
        landmark: editLandmark,
      });
      setEditModalOpen(false);
      fetchMyComplaints();
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update complaint.');
    } finally {
      setEditLoading(false);
    }
  };

  const openWithdrawModal = (c: Complaint) => {
    setWithdrawingComplaint(c);
    setWithdrawReason('Issue already resolved by local residents / no longer active.');
    setWithdrawError(null);
    setWithdrawModalOpen(true);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawingComplaint) return;
    setWithdrawLoading(true);
    setWithdrawError(null);

    try {
      await api.complaints.withdraw(withdrawingComplaint.id, withdrawReason);
      setWithdrawModalOpen(false);
      fetchMyComplaints();
    } catch (err: any) {
      setWithdrawError(err.response?.data?.detail || 'Failed to withdraw complaint.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-pastel-mint border border-pastel-sage shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-pastel-sage text-pastel-forest tracking-wide uppercase">
            Citizen Action Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pastel-charcoal mt-2">
            Welcome back, {user?.full_name || 'Citizen'}!
          </h1>
          <p className="text-pastel-muted text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Track your submitted civic issues, communicate directly with municipal officers, and verify resolution photographs.
          </p>
        </div>

        <Link
          to="/report"
          className="px-6 py-3 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs sm:text-sm shadow-soft hover:scale-102 transition-all flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Report a Civic Issue
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pastel-bg text-pastel-charcoal flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-pastel-forest" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-pastel-charcoal dark:text-white">{total}</p>
            <p className="text-[11px] text-pastel-muted">Total Submitted</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pastel-sky text-blue-800 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{active}</p>
            <p className="text-[11px] text-pastel-muted">Active / In Progress</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-pastel-forest dark:text-emerald-400">{resolved}</p>
            <p className="text-[11px] text-pastel-muted">Resolved & Closed</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pastel-peach text-amber-800 flex items-center justify-center font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">{reopened}</p>
            <p className="text-[11px] text-pastel-muted">Reopened Issues</p>
          </div>
        </div>
      </div>

      {/* Quick Search Tracker Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-pastel-forest shrink-0" />
          <span className="text-xs font-semibold text-pastel-charcoal dark:text-slate-300">
            Have a ticket reference code?
          </span>
        </div>
        <Link
          to="/track"
          className="text-xs font-bold text-pastel-forest hover:underline flex items-center gap-1.5"
        >
          Track with Visual Timeline <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Complaints List / History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pastel-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-pastel-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-pastel-charcoal dark:text-white">My Civic Reports</h3>
            <p className="text-xs text-pastel-muted mt-0.5">Real-time status updates directly from field technicians</p>
          </div>
          <Link
            to="/report"
            className="text-xs font-bold text-pastel-forest hover:underline flex items-center gap-1"
          >
            + Report New <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-pastel-muted">Loading your complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-pastel-mint text-pastel-forest flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-pastel-charcoal dark:text-white">No issues reported yet</h4>
            <p className="text-xs text-pastel-muted max-w-sm mx-auto leading-relaxed">
              Help keep your city clean and safe. If you spot a road crater, broken streetlight, or garbage dump, submit a report!
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-pastel-forest text-white font-bold text-xs shadow-soft"
            >
              <PlusCircle className="w-4 h-4" /> Report an Issue Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-pastel-border">
            {complaints.map((c) => {
              const canEdit = c.status === 'Submitted';
              const canWithdraw = ['Submitted', 'Under Review'].includes(c.status);

              return (
                <div
                  key={c.id}
                  className="p-5 sm:p-6 hover:bg-pastel-bg/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-pastel-bg text-pastel-charcoal border border-pastel-border">
                        {c.complaint_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getPriorityBadgeClass(c.priority)}`}>
                        {c.priority} Priority
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                      {c.reopened_count > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                          Reopened ({c.reopened_count}x)
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-pastel-charcoal dark:text-white leading-snug">
                      {c.title}
                    </h4>

                    <p className="text-xs text-pastel-muted line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-pastel-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-pastel-forest" />
                        {c.landmark || c.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                      {c.expected_resolution_at && (
                        <span className="flex items-center gap-1 text-pastel-forest font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Target SLA: {new Date(c.expected_resolution_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(c)}
                        className="px-3 py-1.5 rounded-xl border border-pastel-border bg-white hover:bg-pastel-bg text-pastel-charcoal font-semibold text-xs transition-colors flex items-center gap-1"
                        title="Edit details while still under submission"
                      >
                        <Edit3 className="w-3 h-3 text-pastel-muted" /> Edit
                      </button>
                    )}

                    {canWithdraw && (
                      <button
                        onClick={() => openWithdrawModal(c)}
                        className="px-3 py-1.5 rounded-xl border border-pastel-peach bg-pastel-peach/40 hover:bg-pastel-peach text-red-900 font-semibold text-xs transition-colors flex items-center gap-1"
                        title="Withdraw complaint if no longer needed"
                      >
                        <Trash2 className="w-3 h-3 text-red-700" /> Withdraw
                      </button>
                    )}

                    <Link
                      to={`/complaints/${c.id}`}
                      className="px-4 py-2 rounded-xl bg-pastel-mint hover:bg-pastel-sage text-pastel-forest font-bold text-xs transition-colors flex items-center gap-1.5 border border-pastel-sage"
                    >
                      View Timeline <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Complaint Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-pastel-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
              <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-pastel-forest" />
                Edit Complaint Details
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-pastel-muted hover:text-pastel-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-pastel-peach text-red-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal mb-1">Physical Landmark</label>
                <input
                  type="text"
                  value={editLandmark}
                  onChange={(e) => setEditLandmark(e.target.value)}
                  placeholder="e.g. Opposite Community Hall"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-pastel-border text-xs font-semibold hover:bg-pastel-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-pastel-forest text-white font-bold text-xs hover:bg-civic-600 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Complaint Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-pastel-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
              <h3 className="font-bold text-sm text-red-800 dark:text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                Withdraw Civic Issue
              </h3>
              <button onClick={() => setWithdrawModalOpen(false)} className="text-pastel-muted hover:text-pastel-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-pastel-muted leading-relaxed">
              Are you sure you want to withdraw ticket <strong>{withdrawingComplaint?.complaint_id}</strong>? The ticket will be marked as Closed and field personnel will not be dispatched.
            </p>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-pastel-peach text-red-900 text-xs">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-pastel-charcoal mb-1">Reason for Withdrawal</label>
                <textarea
                  rows={3}
                  required
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-pastel-border text-xs font-semibold hover:bg-pastel-bg"
                >
                  Keep Active
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {withdrawLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
