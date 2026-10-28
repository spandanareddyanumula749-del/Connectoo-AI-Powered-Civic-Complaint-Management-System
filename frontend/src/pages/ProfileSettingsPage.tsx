import React from 'react';
import { User, Mail, Phone, ShieldCheck, Sun, Moon, Globe, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserRole } from '../types';

export const ProfileSettingsPage: React.FC = () => {
  const { user, role, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          User Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your account identity, role credentials, and display preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.full_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 capitalize">
                <ShieldCheck className="w-3.5 h-3.5" />
                {role} Account
              </span>
              <span className="text-xs text-slate-400">ID #{user?.id}</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Email Address</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {user?.email}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Contact Phone</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" />
              {user?.phone || 'Not Provided'}
            </span>
          </div>
        </div>
      </div>

      {/* Switch Persona for Evaluation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Switch Demo Role Persona
        </h3>
        <p className="text-xs text-slate-500">
          Test the application from different operational viewpoints with 1-click credentials:
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          <button
            onClick={() => switchDemoRole('citizen')}
            className={`p-4 rounded-2xl border text-left text-xs transition-all ${
              role === 'citizen'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <p className="font-bold text-slate-900 dark:text-white">Citizen Persona</p>
            <p className="text-slate-500 mt-1">Priya Sharma</p>
            <p className="text-[10px] text-emerald-600 mt-2 font-mono">citizen@connectoo.gov</p>
          </button>

          <button
            onClick={() => switchDemoRole('admin')}
            className={`p-4 rounded-2xl border text-left text-xs transition-all ${
              role === 'admin'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <p className="font-bold text-slate-900 dark:text-white">Municipal Admin</p>
            <p className="text-slate-500 mt-1">Commissioner Vikram</p>
            <p className="text-[10px] text-emerald-600 mt-2 font-mono">admin@connectoo.gov</p>
          </button>

          <button
            onClick={() => switchDemoRole('worker')}
            className={`p-4 rounded-2xl border text-left text-xs transition-all ${
              role === 'worker'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <p className="font-bold text-slate-900 dark:text-white">Field Worker</p>
            <p className="text-slate-500 mt-1">Suresh (Roads Officer)</p>
            <p className="text-[10px] text-emerald-600 mt-2 font-mono">worker.roads@connectoo.gov</p>
          </button>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Appearance & Theme</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Color Mode</p>
              <p className="text-xs text-slate-400">Switch between light and dark themes</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 font-bold text-xs transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

    </div>
  );
};
