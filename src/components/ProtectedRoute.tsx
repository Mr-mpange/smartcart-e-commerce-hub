import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;
    
    // If no user after loading is complete, redirect to auth
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // If user exists but role is required and doesn't match, redirect to home
    if (requiredRole && userRole && userRole !== requiredRole) {
      navigate('/');
      return;
    }
  }, [user, userRole, loading, navigate, requiredRole]);

  // Show loading while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {requiredRole ? `Verifying ${requiredRole} access...` : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  // Don't render if role is required but user doesn't have it
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Access denied. Redirecting...</p>
      </div>
    );
  }

  // If user exists but role is still being determined, show loading
  if (requiredRole && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
