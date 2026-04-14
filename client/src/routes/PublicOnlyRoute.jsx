import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getDefaultRedirect = (role) => {
  if (role === "admin") return "/admin";
  return "/user";
};

export default function PublicOnlyRoute({ redirectTo }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    const target = redirectTo || getDefaultRedirect(user?.role);
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
