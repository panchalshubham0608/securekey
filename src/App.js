import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";
import MigrateVault from "./components/MigrateVault";
import QuickUnlockVerification from "./components/QuickUnlockVerification";
import VaultItemChangeHistory from "./components/VaultItemChangeHistory";
import VaultItemForm from "./components/VaultItemForm";
import { AppContext } from "./context/AppContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { auth } from "./utils/firebase/firebase";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mek, setMek] = useState(null);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("sk-theme");
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sk-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Listen to auth state
  useEffect(() => {
    // Clear existing storage items
    localStorage.removeItem("encryptedMEK");
    localStorage.removeItem("deviceKey");

    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }

    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        // Logout cleanup
        setMek(null);
        setVaultUnlocked(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Called after password or biometric unlock
  const unlockVault = ({ mek: nextMek, user: nextUser }) => {
    if (!nextMek) return;
    if (nextUser) {
      setUser(nextUser);
    }
    setMek(nextMek);
    setVaultUnlocked(true);
  };

  // Explicit lock
  const lockVault = () => {
    setMek(null);
    setVaultUnlocked(false);
  };

  // Post logout, vault will be locked
  const logout = async () => {
    if (auth) {
      await auth.signOut();
    }
    setUser(null);
    lockVault();
  };

  const contextValue = {
    user,
    authLoading,
    isAuthenticated: !!user,

    mek,
    vaultUnlocked,

    theme,
    toggleTheme,

    unlockVault,
    lockVault,
    logout
  };

  return (
    <div className="App">
      <AppContext.Provider value={contextValue}>
        <QuickUnlockVerification />
        <Router basename="/securekey">
          <Routes>

            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<AuthForm register={false} />} />
              <Route path="/register" element={<AuthForm register={true} />} />
              <Route path="/welcome" element={<Home />} />
            </Route>

            {/* Private routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<VaultItemForm />} />
              <Route path="/edit/:itemId" element={<VaultItemForm />} />
              <Route path="/history/:itemId" element={<VaultItemChangeHistory />} />
              <Route path="/migrate" element={<MigrateVault />} />
            </Route>

          </Routes>
        </Router>
        <button
          type="button"
          className="sk-theme-fab"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          <i className="fa-solid fa-circle-half-stroke" />
          <span>{theme === "dark" ? "Light" : "Dark"} Theme</span>
        </button>
      </AppContext.Provider>
    </div>
  );
}

export default App;

