import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <main className="grid min-h-screen place-items-center font-semibold text-slate-600">Loading...</main>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
