import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && (!userProfile || !allowedRoles.includes(userProfile.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
