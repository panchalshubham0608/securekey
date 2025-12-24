import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";

export default function ProtectedRoute() {
  const {
    isAuthenticated,
    vaultUnlocked,
    authLoading
  } = useAppContext();

  // Wait until auth state is known
  if (authLoading) return <Loader visible />

  if (!isAuthenticated || !vaultUnlocked) {
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
}
