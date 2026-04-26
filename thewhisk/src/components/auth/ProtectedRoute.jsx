import { Navigate } from "react-router-dom";
import useStore from "../../store/useStore";

// ─── UNIFIED PROTECTED ROUTE ENGINE (JWT BASED) ─────────────
const ProtectedRoute = ({ children }) => {
  const { user, authInitialized } = useStore();

  if (!authInitialized)
    return (
      <div className="p-20 text-center text-brown-400">
        Verifying Identity...
      </div>
    );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
