import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { ROLES } from '../utils/constants';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../services/authService';

// Lazy load Pages
const Login = lazy(() => import('../pages/auth/Login'));
const Dashboard = lazy(() => import('../pages/client/Dashboard'));
const Timeline = lazy(() => import('../pages/client/Timeline'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const ManageProjects = lazy(() => import('../pages/admin/ManageProjects'));
const ManageClients = lazy(() => import('../pages/admin/ManageClients'));
const Files = lazy(() => import('../pages/client/Files'));
const UploadUpdate = lazy(() => import('../pages/admin/UploadUpdate'));
const Contact = lazy(() => import('../pages/shared/Contact'));

// Centralized Suspense loader
const FallbackLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
  </div>
);

const InnerLoader = () => (
  <div className="w-full h-64 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

const AppRoutes = () => {
  const { token, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Auth Loader logic resolving flicker
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await getMe();
          setAuth(res.data, token);
        } catch (error) {
          console.error('Session expired', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token, setAuth, logout]);

  if (loading) {
    return <FallbackLoader />;
  }

  return (
    <Suspense fallback={<FallbackLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Shell mapping Outer Layout */}
        <Route element={<AppLayout />}>
          
          {/* Client Specifics */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role={ROLES.CLIENT}>
                <Suspense fallback={<InnerLoader />}><Dashboard /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute role={ROLES.CLIENT}>
                <Suspense fallback={<InnerLoader />}><Timeline /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute role={ROLES.CLIENT}>
                <Suspense fallback={<InnerLoader />}><Files /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<InnerLoader />}><Contact /></Suspense>
            }
          />

          {/* Admin Specifics */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role={ROLES.ADMIN}>
                <Suspense fallback={<InnerLoader />}><AdminDashboard /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute role={ROLES.ADMIN}>
                <Suspense fallback={<InnerLoader />}><ManageClients /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute role={ROLES.ADMIN}>
                <Suspense fallback={<InnerLoader />}><ManageProjects /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/update-upload"
            element={
              <ProtectedRoute role={ROLES.ADMIN}>
                <Suspense fallback={<InnerLoader />}><UploadUpdate /></Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
