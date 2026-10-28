import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, CheckCircle2, Clock, AlertTriangle, MapPin,
  ExternalLink, Camera, Play, CheckCircle, FileText, Upload,
  X, RefreshCw, Filter, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Complaint } from '../types';
import api from '../services/api';

export const WorkerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Completion Modal State
  const [completeModalTask, setCompleteModalTask] = useState<Complaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.worker.getTasks();
      setTasks(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStartTask = async (id: number) => {
    try {
      await api.worker.startTask(id);
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start task.');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAfterPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalTask || !resolutionNotes.trim()) return;

    setSubmitting(true);
    setActionError(null);
    try {
      await api.worker.completeTask(completeModalTask.id, resolutionNotes, afterPhoto || undefined);
      setCompleteModalTask(null);
      setResolutionNotes('');
      setAfterPhoto(null);
      setPhotoPreview(null);
      fetchTasks();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to mark task as resolved.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const pendingCount = tasks.filter(t => ['Assigned', 'In Progress', 'Reopened', 'Escalated'].includes(t.status)).length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tasks.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
  const criticalCount = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-pastel-mint border border-pastel-sage shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-pastel-sage text-pastel-forest tracking-wide uppercase">
            Field Officer Operations Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pastel-charcoal mt-2">
            Officer {user?.full_name}
          </h1>
          <p className="text-pastel-muted text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            View assigned work orders, navigate to reported GPS coordinates, update task progression, and submit completion photographic evidence.
          </p>
        </div>

        <Link
          to="/map"
          className="px-6 py-3 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2 shrink-0"
        >
          <MapPin className="w-4 h-4" />
          Field Navigation Map
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pastel-sky text-blue-800 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-pastel-charcoal dark:text-white">{pendingCount}</p>
            <p className="text-[11px] text-pastel-muted">Active Work Orders</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pastel-lavender text-purple-900 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-purple-800 dark:text-purple-400">{inProgressCount}</p>
            <p className="text-[11px] text-pastel-muted">Currently In Progress</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pastel-peach text-red-900 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5 text-red-700" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-red-800 dark:text-red-400">{criticalCount}</p>
            <p className="text-[11px] text-pastel-muted">Critical Hazards</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-pastel-forest dark:text-emerald-400">{resolvedCount}</p>
            <p className="text-[11px] text-pastel-muted">Completed Tasks</p>
          </div>
        </div>
      </div>

      {/* Task Queue with Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pastel-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-pastel-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-pastel-charcoal dark:text-white">Assigned Task Queue</h3>
            <p className="text-xs text-pastel-muted mt-0.5">Strictly filtered to assignments for your officer account</p>
          </div>

          {/* Filter ribbon */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pastel-border bg-pastel-bg text-pastel-muted">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-pastel-border bg-pastel-bg text-pastel-charcoal focus:ring-1 focus:ring-pastel-forest focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Reopened">Reopened</option>
              <option value="Escalated">Escalated</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-pastel-border bg-pastel-bg text-pastel-charcoal focus:ring-1 focus:ring-pastel-forest focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-pastel-muted">Loading assigned tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-pastel-mint text-pastel-forest flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-pastel-charcoal dark:text-white">All caught up!</h4>
            <p className="text-xs text-pastel-muted max-w-sm mx-auto">
              You have no pending tasks matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-pastel-border">
            {filteredTasks.map((t) => {
              const canStart = ['Assigned', 'Reopened', 'Escalated'].includes(t.status);
              const canComplete = t.status === 'In Progress';
              const isResolved = ['Resolved', 'Closed'].includes(t.status);

              return (
                <div
                  key={t.id}
                  className="p-5 sm:p-6 hover:bg-pastel-bg/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-pastel-bg text-pastel-charcoal border border-pastel-border">
                        {t.complaint_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        t.priority === 'Critical' ? 'bg-pastel-peach text-red-900 border border-red-300' :
                        t.priority === 'High' ? 'bg-pastel-peach/70 text-orange-900 border border-orange-200' :
                        'bg-pastel-sky text-blue-900 border border-blue-200'
                      }`}>
                        {t.priority}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        t.status === 'In Progress' ? 'bg-pastel-lavender text-purple-900 border border-purple-200' :
                        t.status === 'Resolved' ? 'bg-pastel-mint text-pastel-forest border border-pastel-sage' :
                        'bg-pastel-bg text-pastel-charcoal border border-pastel-border'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-pastel-charcoal dark:text-white">
                      {t.title}
                    </h4>

                    <p className="text-xs text-pastel-muted line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-pastel-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-pastel-forest" />
                        {t.landmark || t.address}
                      </span>
                      {t.expected_resolution_at && (
                        <span className="flex items-center gap-1 text-pastel-forest font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          SLA Target: {new Date(t.expected_resolution_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {canStart && (
                      <button
                        onClick={() => handleStartTask(t.id)}
                        className="px-4 py-2 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Work
                      </button>
                    )}

                    {canComplete && (
                      <button
                        onClick={() => {
                          setCompleteModalTask(t);
                          setResolutionNotes('');
                          setAfterPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-pastel-mint hover:bg-pastel-sage border border-pastel-sage text-pastel-forest font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    )}

                    <Link
                      to={`/complaints/${t.id}`}
                      className="px-3.5 py-2 rounded-xl border border-pastel-border bg-white hover:bg-pastel-bg text-pastel-charcoal font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      Details <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete Task Modal */}
      {completeModalTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-card border border-pastel-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
              <h3 className="text-base font-bold text-pastel-charcoal dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-pastel-forest" />
                Submit Task Completion & Evidence
              </h3>
              <button onClick={() => setCompleteModalTask(null)} className="text-pastel-muted hover:text-pastel-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-pastel-muted">
              Ticket: <strong>{completeModalTask.complaint_id}</strong> &bull; {completeModalTask.title}
            </p>

            {actionError && (
              <div className="p-3 rounded-xl bg-pastel-peach text-red-900 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-pastel-charcoal mb-1">
                  Resolution Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the remediation actions taken on site..."
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-pastel-charcoal mb-1">
                  After Remediation Photograph <span className="text-pastel-muted font-normal">(Optional proof)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="w-full text-xs text-pastel-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pastel-mint file:text-pastel-forest hover:file:bg-pastel-sage"
                />
                {photoPreview && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-pastel-border h-32 w-full max-w-xs">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalTask(null)}
                  className="px-4 py-2 font-semibold text-pastel-muted hover:bg-pastel-bg rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold bg-pastel-forest text-white rounded-xl shadow-soft hover:bg-civic-600 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Submit & Resolve Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
