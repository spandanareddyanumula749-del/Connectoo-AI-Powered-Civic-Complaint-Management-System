import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Search, MapPin, Bot, Bell, Settings,
  ClipboardList, Building2, BarChart3, Wrench, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: any;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const { user, role } = useAuth();

  const citizenNav: NavItem[] = [
    { label: 'Citizen Portal', to: '/citizen', icon: LayoutDashboard },
    { label: 'Report a Problem', to: '/report', icon: PlusCircle, highlight: true },
    { label: 'Track Complaint', to: '/track', icon: Search },
    { label: 'Interactive Map', to: '/map', icon: MapPin },
    { label: 'Civic AI Assistant', to: '/chat', icon: Bot },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Profile & Settings', to: '/profile', icon: Settings },
  ];

  const adminNav: NavItem[] = [
    { label: 'Admin Command', to: '/admin', icon: LayoutDashboard },
    { label: 'Manage Complaints', to: '/admin/complaints', icon: ClipboardList },
    { label: 'Departments & Staff', to: '/admin/departments', icon: Building2 },
    { label: 'Predictive Analytics', to: '/admin/analytics', icon: BarChart3 },
    { label: 'Civic Map Overview', to: '/map', icon: MapPin },
    { label: 'AI Assistant', to: '/chat', icon: Bot },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'System Settings', to: '/profile', icon: Settings },
  ];

  const workerNav: NavItem[] = [
    { label: 'Worker Tasks', to: '/worker', icon: Wrench },
    { label: 'Civic Navigation Map', to: '/map', icon: MapPin },
    { label: 'AI Assistant', to: '/chat', icon: Bot },
    { label: 'Task Notifications', to: '/notifications', icon: Bell },
    { label: 'Worker Profile', to: '/profile', icon: Settings },
  ];

  const currentNav = role === 'admin' ? adminNav : role === 'worker' ? workerNav : citizenNav;

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-white dark:bg-[#1A231F] border-r border-pastel-border p-4 min-h-[calc(100vh-4rem)]">
      {/* User Mini Card */}
      <div className="p-3 mb-5 rounded-2xl bg-pastel-mint/50 dark:bg-slate-800/60 border border-pastel-sage flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pastel-forest text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-soft">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-pastel-charcoal dark:text-slate-100 truncate">
            {user?.full_name}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-pastel-forest capitalize">
            <ShieldCheck className="w-3 h-3" />
            {role || 'Citizen'}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="space-y-1">
        {currentNav.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/citizen' || item.to === '/admin' || item.to === '/worker'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-pastel-forest text-white shadow-soft font-bold'
                    : item.highlight
                    ? 'text-pastel-forest bg-pastel-mint border border-pastel-sage font-semibold hover:bg-pastel-sage'
                    : 'text-pastel-muted hover:bg-pastel-bg hover:text-pastel-charcoal'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
