import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "./States";

const dashboardByRole = {
  pasien: "/patient/dashboard",
  dokter: "/doctor/dashboard",
  admin: "/admin/dashboard"
};

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={dashboardByRole[user.role] || "/login"} replace />;
  }

  return <Outlet />;
}
