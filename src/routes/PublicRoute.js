import { useContext } from "react";
import { Navigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const PublicRoute = ({ children }) => {
  const { user } = useContext(UserContext);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
