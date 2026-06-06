import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePremium?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin, requirePremium }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requirePremium && user?.plan !== 'premium' && user?.role !== 'admin') {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}