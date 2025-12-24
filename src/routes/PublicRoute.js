import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";

export default function PublicRoute() {
  const {
    isAuthenticated,
    vaultUnlocked,
    authLoading
  } = useAppContext();

  if (authLoading) return <Loader visible />

  // User fully logged in & unlocked → block public pages
  if (isAuthenticated && vaultUnlocked) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
