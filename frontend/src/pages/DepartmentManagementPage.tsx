import React, { useEffect, useState } from 'react';
import {
  Building2, Users, PlusCircle, Phone, Mail, Clock, CheckCircle2,
  AlertCircle, UserPlus, ShieldAlert, KeyRound, Copy, Check, ToggleLeft, ToggleRight, X, RefreshCw
} from 'lucide-react';
import { Department, User as UserType } from '../types';
import api from '../services/api';

export const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workers, setWorkers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // New Department Modal
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headEmail, setHeadEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [slaHours, setSlaHours] = useState(48);
  const [creatingDept, setCreatingDept] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // New Worker Invitation Modal
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerDeptId, setWorkerDeptId] = useState<number>(1);
  const [workerCustomPassword, setWorkerCustomPassword] = useState('');
  const [invitingWorker, setInvitingWorker] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [createdWorkerCreds, setCreatedWorkerCreds] = useState<{ email: string; pass: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dList, wList] = await Promise.all([
        api.admin.getDepartments(),
        api.auth.listUsers('worker'),
      ]);
      setDepartments(dList);
      setWorkers(wList);
      if (dList.length > 0) {
        setWorkerDeptId(dList[0].id);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDept(true);
    setDeptError(null);
    try {
      await api.admin.createDepartment({
        name,
        code,
        description,
        head_email: headEmail,
        phone,
        sla_hours_default: slaHours,
      });
      setDeptModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      setDeptError(err.response?.data?.detail || 'Failed to create department.');
    } finally {
      setCreatingDept(false);
    }
  };

  const handleInviteWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvitingWorker(true);
    setWorkerError(null);
    try {
      const res = await api.admin.createWorker({
        full_name: workerName.trim(),
        email: workerEmail.trim(),
        department_id: workerDeptId,
        phone: workerPhone.trim() || undefined,
        password: workerCustomPassword.trim() || undefined,
      });

      setCreatedWorkerCreds({
        name: res.worker.full_name,
        email: res.worker.email,
        pass: res.temporary_password || 'Custom Password',
      });
      fetchData();
    } catch (err: any) {
      setWorkerError(err.response?.data?.detail || 'Failed to provision worker account.');
    } finally {
      setInvitingWorker(false);
    }
  };

  const handleToggleWorkerStatus = async (workerId: number) => {
    try {
      await api.admin.toggleWorkerStatus(workerId);
      fetchData();
    } catch {
      //
    }
  };

  const copyCreds = () => {
    if (!createdWorkerCreds) return;
    const text = `Connectoo Worker Login:\nEmail: ${createdWorkerCreds.email}\nTemporary Password: ${createdWorkerCreds.pass}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pastel-charcoal dark:text-white">
            Departments & Field Personnel
          </h1>
          <p className="text-xs sm:text-sm text-pastel-muted">
            Municipal divisions, service level targets, and field officer provisioning
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setCreatedWorkerCreds(null);
              setWorkerName('');
              setWorkerEmail('');
              setWorkerPhone('');
              setWorkerCustomPassword('');
              setWorkerError(null);
              setWorkerModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-colors flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Provision Worker
          </button>

          <button
            onClick={() => setDeptModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-pastel-border hover:bg-pastel-bg text-pastel-charcoal font-bold text-xs shadow-soft transition-colors flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-pastel-forest" /> Add Department
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((d) => {
          const deptWorkers = workers.filter(w => w.department_id === d.id);
          const activeTickets = d.active_complaints_count || 0;

          return (
            <div
              key={d.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-pastel-border shadow-soft space-y-4 hover:shadow-card transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-pastel-bg text-pastel-charcoal border border-pastel-border">
                    {d.code}
                  </span>
                  <h3 className="font-bold text-sm text-pastel-charcoal dark:text-white mt-1">
                    {d.name}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-pastel-mint text-pastel-forest flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-pastel-muted line-clamp-2">
                {d.description || 'Municipal department for civic maintenance.'}
              </p>

              {/* Workload Meter */}
              <div className="p-3.5 rounded-2xl bg-pastel-bg/60 border border-pastel-border space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-pastel-muted font-medium">Active Backlog</span>
                  <span className="font-extrabold text-pastel-charcoal dark:text-white">{activeTickets} complaints</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-pastel-border overflow-hidden">
                  <div
                    className="h-full bg-pastel-forest transition-all"
                    style={{ width: `${Math.min(100, (activeTickets / 10) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Department Contact & Staff Meta */}
              <div className="space-y-1.5 text-xs text-pastel-muted pt-2 border-t border-pastel-border">
                {d.head_email && (
                  <p className="flex items-center gap-2 truncate text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-pastel-muted shrink-0" />
                    <span>{d.head_email}</span>
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="flex items-center gap-1.5 text-pastel-forest font-semibold">
                    <Clock className="w-3.5 h-3.5" /> SLA: {d.sla_hours_default}h
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-pastel-charcoal dark:text-white">
                    <Users className="w-3.5 h-3.5 text-pastel-muted" /> {deptWorkers.length} Officers
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Field Personnel Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pastel-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-pastel-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-pastel-charcoal dark:text-white">Active Field Personnel & Workers</h3>
            <p className="text-xs text-pastel-muted mt-0.5">
              Authorized municipal officers deployed for physical infrastructure repairs
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-pastel-mint text-pastel-forest border border-pastel-sage self-start sm:self-auto">
            {workers.length} Registered Workers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-pastel-bg/60 border-b border-pastel-border text-[11px] font-bold text-pastel-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Officer Name</th>
                <th className="py-3 px-6">Assigned Department</th>
                <th className="py-3 px-6">Contact Email</th>
                <th className="py-3 px-6">Phone</th>
                <th className="py-3 px-6">Account Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pastel-border text-pastel-charcoal dark:text-slate-200">
              {workers.map((w) => {
                const assignedDept = departments.find(d => d.id === w.department_id);
                return (
                  <tr key={w.id} className="hover:bg-pastel-bg/40 transition-colors">
                    <td className="py-3.5 px-6 font-bold flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-pastel-mint text-pastel-forest flex items-center justify-center font-extrabold text-[11px]">
                        {w.full_name.charAt(0)}
                      </div>
                      <span>{w.full_name}</span>
                    </td>
                    <td className="py-3.5 px-6 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-pastel-mint text-pastel-forest border border-pastel-sage font-semibold text-[11px]">
                        {assignedDept?.name || 'General Municipal'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-pastel-muted font-mono text-[11px]">{w.email}</td>
                    <td className="py-3.5 px-6 text-pastel-muted">{w.phone || 'N/A'}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        w.is_active
                          ? 'bg-pastel-mint text-pastel-forest border border-pastel-sage'
                          : 'bg-pastel-peach text-red-900 border border-pastel-peach'
                      }`}>
                        {w.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleToggleWorkerStatus(w.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                          w.is_active
                            ? 'border-pastel-peach text-red-800 hover:bg-pastel-peach/50'
                            : 'border-pastel-sage text-pastel-forest hover:bg-pastel-mint'
                        }`}
                      >
                        {w.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Worker Modal */}
      {workerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-card border border-pastel-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
              <h3 className="text-base font-bold text-pastel-charcoal dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-pastel-forest" />
                Provision Field Worker Account
              </h3>
              <button onClick={() => setWorkerModalOpen(false)} className="text-pastel-muted hover:text-pastel-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdWorkerCreds ? (
              <div className="p-6 rounded-2xl bg-pastel-mint border border-pastel-sage text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-pastel-forest mx-auto" />
                <div>
                  <h4 className="font-bold text-sm text-pastel-forest">Worker Account Provisioned!</h4>
                  <p className="text-xs text-pastel-muted mt-1">
                    An official invitation email has been dispatched with their sign-in credentials.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-pastel-sage text-left space-y-1 font-mono text-xs">
                  <p><strong>Name:</strong> {createdWorkerCreds.name}</p>
                  <p><strong>Email:</strong> {createdWorkerCreds.email}</p>
                  <p><strong>Temporary Password:</strong> <code className="bg-pastel-mint px-1.5 py-0.5 rounded">{createdWorkerCreds.pass}</code></p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyCreds}
                    className="flex-1 py-2 rounded-xl bg-white border border-pastel-border font-bold text-xs hover:bg-pastel-bg flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
                  </button>
                  <button
                    onClick={() => setWorkerModalOpen(false)}
                    className="py-2 px-5 rounded-xl bg-pastel-forest text-white font-bold text-xs hover:bg-civic-600"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteWorker} className="space-y-3.5 text-xs">
                {workerError && (
                  <div className="p-3 rounded-xl bg-pastel-peach text-red-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{workerError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-pastel-charcoal mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-pastel-charcoal mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    value={workerEmail}
                    onChange={(e) => setWorkerEmail(e.target.value)}
                    placeholder="worker.name@connectoo.gov"
                    className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-pastel-charcoal mb-1">Assigned Department *</label>
                    <select
                      value={workerDeptId}
                      onChange={(e) => setWorkerDeptId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-pastel-charcoal mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={workerPhone}
                      onChange={(e) => setWorkerPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-pastel-charcoal mb-1">
                    Custom Temporary Password <span className="text-pastel-muted font-normal">(Leave empty to auto-generate)</span>
                  </label>
                  <input
                    type="text"
                    value={workerCustomPassword}
                    onChange={(e) => setWorkerCustomPassword(e.target.value)}
                    placeholder="Auto-generated secure password"
                    className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setWorkerModalOpen(false)}
                    className="px-4 py-2 font-semibold text-pastel-muted hover:bg-pastel-bg rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={invitingWorker}
                    className="px-5 py-2 font-bold bg-pastel-forest text-white rounded-xl shadow-soft hover:bg-civic-600 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {invitingWorker && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Provision & Send Invite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-card border border-pastel-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
              <h3 className="text-base font-bold text-pastel-charcoal dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-pastel-forest" />
                Create Municipal Department
              </h3>
              <button onClick={() => setDeptModalOpen(false)} className="text-pastel-muted hover:text-pastel-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deptError && (
              <p className="text-xs text-red-600">{deptError}</p>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bridges & Flyovers Division"
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BRIDGES"
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities..."
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Head Email</label>
                  <input
                    type="email"
                    value={headEmail}
                    onChange={(e) => setHeadEmail(e.target.value)}
                    placeholder="officer@connectoo.gov"
                    className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Default SLA (Hours)</label>
                  <input
                    type="number"
                    value={slaHours}
                    onChange={(e) => setSlaHours(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-pastel-border bg-pastel-bg/50 focus:ring-2 focus:ring-pastel-forest focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 font-semibold text-pastel-muted hover:bg-pastel-bg rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDept}
                  className="px-5 py-2 font-bold bg-pastel-forest text-white rounded-xl shadow-soft hover:bg-civic-600 disabled:opacity-50"
                >
                  {creatingDept ? 'Saving...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
