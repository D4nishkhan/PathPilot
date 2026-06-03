import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePremium?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin, requirePremium }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  console.log('[ProtectedRoute] Checking auth - isAuthenticated:', isAuthenticated);
  console.log('[ProtectedRoute] Checking auth - user:', user);
  console.log('[ProtectedRoute] Checking auth - user?.role:', user?.role);
  console.log('[ProtectedRoute] Checking auth - user?.plan:', user?.plan);

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] REDIRECTING TO LOGIN - isAuthenticated is false');
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    console.log('[ProtectedRoute] REDIRECTING TO DASHBOARD - requireAdmin but user is not admin');
    return <Navigate to="/dashboard" replace />;
  }

  if (requirePremium && user?.plan !== 'premium' && user?.role !== 'admin') {
    console.log('[ProtectedRoute] REDIRECTING TO PRICING - requirePremium but user does not have premium');
    return <Navigate to="/pricing" replace />;
  }

  console.log('[ProtectedRoute] AUTH PASSED - Rendering children');
  return <>{children}</>;
}
