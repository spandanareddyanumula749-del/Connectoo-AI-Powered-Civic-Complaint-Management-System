import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, Clock, MapPin, CheckCircle2, RotateCcw,
  MessageSquare, Star, Send, Camera, User, FileText, AlertTriangle, ArrowLeft,
  Sparkles, BrainCircuit, RefreshCw, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { Complaint, Comment, StatusHistory } from '../types';
import api from '../services/api';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<{
    summary: string;
    reported_issue: string;
    location_clues: string;
    impact_assessment: string;
    missing_information: string[];
  } | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // New Comment
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Reopen Modal
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenRemarks, setReopenRemarks] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  // Feedback Modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const data = await api.complaints.getById(id);
      setComplaint(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSummarize = async () => {
    if (!complaint) return;
    setSummarizing(true);
    try {
      const res = await api.admin.summarizeComplaint(complaint.id);
      setAiSummary(res);
    } catch {
      //
    } finally {
      setSummarizing(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !complaint) return;
    setCommentSubmitting(true);
    try {
      await api.complaints.addComment(complaint.id, commentText);
      setCommentText('');
      fetchDetail();
    } catch {
      //
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setReopenSubmitting(true);
    try {
      await api.complaints.reopen(complaint.id, reopenRemarks);
      setReopenOpen(false);
      setReopenRemarks('');
      fetchDetail();
    } catch {
      //
    } finally {
      setReopenSubmitting(false);
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setFeedbackSubmitting(true);
    try {
      await api.feedback.submit(complaint.id, { rating, review_text: reviewText });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setFeedbackOpen(false);
      fetchDetail();
    } catch {
      //
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-xs text-pastel-muted">Loading complaint details...</div>;
  }

  if (!complaint) {
    return (
      <div className="p-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-pastel-charcoal">Complaint Not Found</h2>
        <Link to="/" className="text-pastel-forest font-bold hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const isCitizenOwner = user?.id === complaint.citizen_id;
  const isResolvedOrClosed = ['Resolved', 'Closed'].includes(complaint.status);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Back button */}
      <div>
        <Link
          to={user?.role === 'admin' ? '/admin/complaints' : user?.role === 'worker' ? '/worker' : '/citizen'}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-pastel-muted hover:text-pastel-forest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pastel-border shadow-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-pastel-bg text-pastel-charcoal border border-pastel-border">
                {complaint.complaint_id}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-pastel-mint text-pastel-forest border border-pastel-sage">
                {complaint.status}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-pastel-sky text-blue-900 border border-blue-200">
                {complaint.priority} Priority
              </span>
              {complaint.reopened_count > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-pastel-peach text-red-900 border border-pastel-peach">
                  Reopened ({complaint.reopened_count}x)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-pastel-charcoal dark:text-white pt-2">
              {complaint.title}
            </h1>
          </div>

          {/* Action Buttons for Citizen & Admin */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleSummarize}
                disabled={summarizing}
                className="px-3.5 py-2 rounded-xl bg-pastel-lavender text-purple-900 font-bold text-xs border border-purple-200 hover:bg-pastel-lavender/80 transition-colors flex items-center gap-1.5 shadow-soft"
              >
                {summarizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                AI Summarize
              </button>
            )}

            {isResolvedOrClosed && !complaint.feedback && isCitizenOwner && (
              <button
                onClick={() => setFeedbackOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
              >
                <Star className="w-4 h-4" /> Rate Resolution
              </button>
            )}

            {isResolvedOrClosed && isCitizenOwner && (
              <button
                onClick={() => setReopenOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Reopen Issue
              </button>
            )}
          </div>
        </div>

        {/* AI Summary Card (if generated) */}
        {aiSummary && (
          <div className="p-5 rounded-2xl bg-pastel-lavender/40 border border-purple-200 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-purple-950 font-bold text-xs">
              <BrainCircuit className="w-4 h-4 text-purple-700" />
              <span>AI Executive Complaint Summary</span>
            </div>
            <p className="text-xs text-pastel-charcoal leading-relaxed font-medium">
              {aiSummary.summary}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-200/60 text-[11px]">
              <div>
                <span className="text-purple-800 font-bold block">Assessed Impact:</span>
                <span className="text-pastel-muted">{aiSummary.impact_assessment}</span>
              </div>
              <div>
                <span className="text-purple-800 font-bold block">Location Clues:</span>
                <span className="text-pastel-muted">{aiSummary.location_clues}</span>
              </div>
            </div>
          </div>
        )}

        {/* Description & Translation */}
        <div className="p-4 rounded-2xl bg-pastel-bg/60 border border-pastel-border text-xs sm:text-sm text-pastel-charcoal space-y-2">
          <p className="whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
          {complaint.translated_text && (
            <div className="mt-3 pt-3 border-t border-pastel-border text-xs text-purple-800 italic">
              <strong>Municipal Translation View:</strong> {complaint.translated_text}
            </div>
          )}
        </div>

        {/* Meta Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div>
            <span className="text-pastel-muted block mb-0.5">Category</span>
            <span className="font-bold text-pastel-charcoal dark:text-white">{complaint.category_name}</span>
          </div>
          <div>
            <span className="text-pastel-muted block mb-0.5">Assigned Department</span>
            <span className="font-bold text-pastel-charcoal dark:text-white">{complaint.department_name}</span>
          </div>
          <div>
            <span className="text-pastel-muted block mb-0.5">Reported Location</span>
            <span className="font-bold text-pastel-charcoal dark:text-white">{complaint.landmark || complaint.address}</span>
          </div>
          <div>
            <span className="text-pastel-muted block mb-0.5">Target SLA</span>
            <span className="font-bold text-pastel-forest">
              {complaint.expected_resolution_at
                ? new Date(complaint.expected_resolution_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Attachments / Before & After Photos */}
      {complaint.attachments && complaint.attachments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pastel-border p-6 sm:p-8 shadow-card space-y-4">
          <h3 className="font-bold text-base text-pastel-charcoal dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-pastel-forest" />
            Photo Evidence & Remediation Photographs
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {complaint.attachments.map(att => (
              <div key={att.id} className="rounded-2xl overflow-hidden border border-pastel-border group relative">
                <img src={att.file_path} alt={att.file_name} className="w-full h-36 object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/70 text-white text-[10px] truncate">
                  <span className="capitalize font-bold">{att.attachment_type.replace('_', ' ')}</span>: {att.file_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Chronological Status Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pastel-border p-6 sm:p-8 shadow-card space-y-6">
        <div>
          <h3 className="font-bold text-base text-pastel-charcoal dark:text-white">
            Official Resolution Timeline
          </h3>
          <p className="text-xs text-pastel-muted mt-0.5">Audited history of all state changes and technician updates</p>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-pastel-border">
          {complaint.status_history && complaint.status_history.map((hist) => (
            <div key={hist.id} className="relative group">
              <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-pastel-forest text-white flex items-center justify-center text-[10px] font-bold shadow-soft">
                ✓
              </span>
              <div className="p-4 rounded-2xl bg-pastel-bg/60 border border-pastel-border text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-pastel-charcoal dark:text-white text-sm">
                    {hist.new_status}
                  </span>
                  <span className="text-[11px] text-pastel-muted">
                    {new Date(hist.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-pastel-charcoal pt-0.5">{hist.remarks || 'Status updated.'}</p>
                <p className="text-[10px] text-pastel-muted pt-1">Responsible Officer: {hist.changed_by_name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments & Discussion */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pastel-border p-6 sm:p-8 shadow-card space-y-6">
        <div>
          <h3 className="font-bold text-base text-pastel-charcoal dark:text-white">
            Citizen & Department Communication
          </h3>
          <p className="text-xs text-pastel-muted mt-0.5">Add comments or ask questions regarding this ticket</p>
        </div>

        {/* Existing Comments */}
        <div className="space-y-3">
          {complaint.comments && complaint.comments.length === 0 ? (
            <p className="text-xs text-pastel-muted italic">No comments posted yet.</p>
          ) : (
            complaint.comments?.map((comm) => (
              <div
                key={comm.id}
                className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  comm.author_role === 'admin' || comm.author_role === 'worker'
                    ? 'bg-pastel-sky/50 border-blue-200'
                    : 'bg-pastel-bg/60 border-pastel-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pastel-charcoal dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-pastel-muted" />
                    {comm.author_name}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-pastel-border uppercase">
                      {comm.author_role}
                    </span>
                  </span>
                  <span className="text-[10px] text-pastel-muted">
                    {new Date(comm.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <p className="text-pastel-charcoal pt-1 leading-relaxed">{comm.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
          <input
            type="text"
            required
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a message or additional details for the department..."
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 text-pastel-charcoal focus:outline-none focus:ring-2 focus:ring-pastel-forest"
          />
          <button
            type="submit"
            disabled={commentSubmitting || !commentText.trim()}
            className="px-5 py-2.5 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Post
          </button>
        </form>
      </div>

      {/* Reopen Modal Dialog */}
      {reopenOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-card border border-pastel-border space-y-4">
            <h3 className="text-base font-bold text-pastel-charcoal dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-600" />
              Reopen Civic Complaint
            </h3>
            <p className="text-xs text-pastel-muted">
              Please explain why the issue is considered unresolved or has resurfaced:
            </p>
            <textarea
              required
              rows={3}
              value={reopenRemarks}
              onChange={(e) => setReopenRemarks(e.target.value)}
              placeholder="e.g., Paving collapsed again after heavy rain..."
              className="w-full p-3 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 text-pastel-charcoal"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReopenOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-pastel-muted hover:bg-pastel-bg rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopen}
                disabled={reopenSubmitting}
                className="px-5 py-2 text-xs font-bold bg-red-600 text-white rounded-xl shadow-soft hover:bg-red-700 disabled:opacity-50"
              >
                {reopenSubmitting ? 'Reopening...' : 'Confirm Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal Dialog */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-card border border-pastel-border space-y-4">
            <h3 className="text-base font-bold text-pastel-charcoal dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Rate Resolution Quality
            </h3>
            <p className="text-xs text-pastel-muted">
              How satisfied are you with the municipal repair work completed?
            </p>
            <div className="flex items-center justify-center gap-3 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Optional remarks on worker responsiveness, cleanliness, or workmanship..."
              className="w-full p-3 text-xs rounded-xl border border-pastel-border bg-pastel-bg/50 text-pastel-charcoal"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-pastel-muted hover:bg-pastel-bg rounded-xl"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleFeedback}
                disabled={feedbackSubmitting}
                className="px-5 py-2 text-xs font-bold bg-pastel-forest text-white rounded-xl shadow-soft hover:bg-civic-600 disabled:opacity-50"
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
