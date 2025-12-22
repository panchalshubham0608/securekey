import { onAuthStateChanged } from "firebase/auth";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import { readMEKFromDevice } from "../utils/auth/mek";
import { createUserForContext } from "../utils/contextutil";
import { auth } from "../utils/firebase/firebase";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const userContext = useContext(UserContext);

  useEffect(() => {
    // If the user is already present in the context, simply proceed
    if (userContext.user) return;

    // If the user is authenticated and we have MEK persisted locally, build user's context
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/", { replace: true });  // Redirect to home if not logged in
      const mek = readMEKFromDevice();
      if (!mek) return navigate("/", { replace: true });  // Redirect to home if we cannot retrieve MEK
      const userForContext = createUserForContext({ username: user.email, password: mek });
      userContext.setUser(userForContext);
    });

    return () => unsub();
  }, [navigate]);

  return <>{children}</>;
};

export default ProtectedRoute;
