import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatWidget } from './components/ChatWidget';

// 15 Complete Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { ReportComplaintPage } from './pages/ReportComplaintPage';
import { ComplaintTrackingPage } from './pages/ComplaintTrackingPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { CivicMapPage } from './pages/CivicMapPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ComplaintManagementPage } from './pages/ComplaintManagementPage';
import { DepartmentManagementPage } from './pages/DepartmentManagementPage';
import { AnalyticsReportsPage } from './pages/AnalyticsReportsPage';
import { WorkerDashboardPage } from './pages/WorkerDashboardPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-16 text-center text-xs text-slate-400">Verifying session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    return <Navigate to="/citizen" replace />;
  }

  return <>{children}</>;
};

// Layout Shell
const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Pages that display sidebar when authenticated
  const isDashboardRoute = [
    '/citizen', '/admin', '/admin/complaints', '/admin/departments',
    '/admin/analytics', '/worker', '/notifications', '/profile'
  ].some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

  const showSidebar = isAuthenticated && isDashboardRoute;

  return (
    <div className="min-h-screen flex flex-col bg-pastel-bg dark:bg-[#121815] text-pastel-charcoal dark:text-slate-100 transition-colors font-sans">
      <Navbar />

      <div className="flex-1 flex w-full">
        {showSidebar && <Sidebar />}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full ${!showSidebar ? 'max-w-7xl' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/map" element={<CivicMapPage />} />
            <Route path="/track" element={<ComplaintTrackingPage />} />
            <Route path="/chat" element={<ChatbotPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

            {/* Citizen Routes */}
            <Route
              path="/citizen"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <CitizenDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <ReportComplaintPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ComplaintManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DepartmentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AnalyticsReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Field Worker Routes */}
            <Route
              path="/worker"
              element={
                <ProtectedRoute allowedRoles={['worker', 'admin']}>
                  <WorkerDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Shared Authenticated Routes */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
