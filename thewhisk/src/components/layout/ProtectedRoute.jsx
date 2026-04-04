import { Navigate, Outlet } from 'react-router-dom';
import useStore from '../../store/useStore';

export default function ProtectedRoute({ requireAdmin = false }) {
  const { isAuthenticated, authInitialized, isAdmin, user } = useStore();

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center animate-bounce">
          <span className="text-4xl block mb-2">🧁</span>
          <p className="text-sm text-brown-400">Restoring Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

