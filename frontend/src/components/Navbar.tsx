import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Bell, Sun, Moon, LogIn, LogOut, User,
  Menu, X, MapPin, Search, Bot, PlusCircle, CheckCircle2, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, switchDemoRole, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = async (newRole: UserRole) => {
    setDemoMenuOpen(false);
    await switchDemoRole(newRole);
    if (newRole === 'admin') navigate('/admin');
    else if (newRole === 'worker') navigate('/worker');
    else navigate('/citizen');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#1A231F]/95 backdrop-blur-md border-b border-pastel-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-pastel-mint border border-pastel-sage flex items-center justify-center text-pastel-forest shadow-soft group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-pastel-forest dark:text-emerald-400 tracking-tight">
                  Connectoo
                </span>
                <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-pastel-mint text-pastel-forest border border-pastel-sage">
                  Smart Municipal Hub
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-1 font-medium text-xs text-pastel-muted dark:text-slate-300">
            <Link to="/" className="px-3 py-2 rounded-xl hover:bg-pastel-bg hover:text-pastel-charcoal transition-colors">
              Home
            </Link>
            <Link to="/map" className="px-3 py-2 rounded-xl hover:bg-pastel-bg hover:text-pastel-charcoal flex items-center gap-1.5 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-pastel-forest" />
              Civic Map
            </Link>
            <Link to="/track" className="px-3 py-2 rounded-xl hover:bg-pastel-bg hover:text-pastel-charcoal flex items-center gap-1.5 transition-colors">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Track Issue
            </Link>
            <Link to="/chat" className="px-3 py-2 rounded-xl hover:bg-pastel-bg hover:text-pastel-charcoal flex items-center gap-1.5 transition-colors">
              <Bot className="w-3.5 h-3.5 text-purple-600" />
              AI Assistant
            </Link>

            {isAuthenticated && (
              <Link
                to={role === 'admin' ? '/admin' : role === 'worker' ? '/worker' : '/citizen'}
                className="px-3 py-1.5 rounded-xl bg-pastel-mint text-pastel-forest border border-pastel-sage font-semibold text-xs transition-colors ml-1"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2">
            
            {/* Quick Demo Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-pastel-border bg-pastel-bg text-pastel-charcoal dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 hover:bg-pastel-mint/50 transition-all shadow-soft"
                title="Switch test role"
              >
                <span>Role: <strong>{role ? role.toUpperCase() : 'GUEST'}</strong></span>
                <ChevronDown className="w-3 h-3 text-pastel-muted" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-pastel-border py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-pastel-muted border-b border-pastel-border">
                    Switch Active Persona
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('citizen')}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-pastel-bg text-pastel-charcoal dark:text-slate-200"
                  >
                    <span>Citizen (Priya Sharma)</span>
                    {role === 'citizen' && <CheckCircle2 className="w-3.5 h-3.5 text-pastel-forest" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-pastel-bg text-pastel-charcoal dark:text-slate-200"
                  >
                    <span>Admin (Commissioner)</span>
                    {role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-pastel-forest" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('worker')}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-pastel-bg text-pastel-charcoal dark:text-slate-200"
                  >
                    <span>Field Worker (Suresh - Roads)</span>
                    {role === 'worker' && <CheckCircle2 className="w-3.5 h-3.5 text-pastel-forest" />}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 rounded-xl text-pastel-charcoal dark:text-slate-300 hover:bg-pastel-bg dark:hover:bg-slate-800 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-pastel-border p-2 z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-pastel-border">
                      <h4 className="font-bold text-xs text-pastel-charcoal dark:text-white">Notifications ({unreadCount} new)</h4>
                      <Link
                        to="/notifications"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-[11px] font-semibold text-pastel-forest hover:underline"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-pastel-border">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-pastel-muted text-center py-6">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 5).map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.complaint_id) navigate(`/complaints/${n.complaint_id}`);
                              setNotifDropdownOpen(false);
                            }}
                            className={`p-3 cursor-pointer text-xs transition-colors hover:bg-pastel-bg ${
                              !n.is_read ? 'bg-pastel-mint/40 font-medium' : ''
                            }`}
                          >
                            <p className="font-semibold text-pastel-charcoal dark:text-slate-200">{n.title}</p>
                            <p className="text-pastel-muted mt-0.5 line-clamp-2 text-[11px]">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-pastel-charcoal dark:text-slate-300 hover:bg-pastel-bg dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Report Issue CTA button */}
            <Link
              to="/report"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-pastel-forest hover:bg-civic-600 text-white font-bold text-xs shadow-soft transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Issue
            </Link>

            {/* User Profile / Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-1">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-pastel-bg text-xs font-semibold"
                >
                  <div className="w-7 h-7 rounded-full bg-pastel-forest text-white text-[11px] flex items-center justify-center font-bold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 text-pastel-muted hover:text-red-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pastel-forest text-white hover:bg-civic-600 transition-all shadow-soft"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-pastel-charcoal dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-pastel-border space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium hover:bg-pastel-bg"
            >
              Home
            </Link>
            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium hover:bg-pastel-bg"
            >
              Interactive Map
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium hover:bg-pastel-bg"
            >
              Track Complaint
            </Link>
            <Link
              to="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-medium hover:bg-pastel-bg"
            >
              AI Assistant
            </Link>
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-pastel-forest bg-pastel-mint hover:bg-pastel-sage"
            >
              + Report New Problem
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
