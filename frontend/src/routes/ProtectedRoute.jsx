import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    const fallbackRoute = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
