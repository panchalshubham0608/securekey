import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";
import MigrateVault from "./components/MigrateVault";
import VaultItemChangeHistory from "./components/VaultItemChangeHistory";
import VaultItemForm from "./components/VaultItemForm";
import { AppContext } from "./context/AppContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { auth } from "./utils/firebase/firebase";
import {
  disableQuickUnlock,
  getQuickUnlockUser
} from "./utils/quickunlock/quickUnlockService";

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
const INACTIVITY_WARNING_MS = 4 * 60 * 1000; // Show warning at 4 minutes
const INACTIVITY_WARNING_WINDOW_SEC =
  (INACTIVITY_LIMIT_MS - INACTIVITY_WARNING_MS) / 1000;

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mek, setMek] = useState(null);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(null);
  const lastActivityRef = useRef(Date.now());

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
      const savedUser = getQuickUnlockUser();
      if (savedUser) {
        setUser(savedUser);
      }
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
  const unlockVault = useCallback(({ mek: nextMek, user: nextUser }) => {
    if (!nextMek) return;
    if (nextUser) {
      setUser(nextUser);
    }
    lastActivityRef.current = Date.now();
    setInactivitySecondsLeft(null);
    setMek(nextMek);
    setVaultUnlocked(true);
  }, []);

  // Explicit lock (wipes MEK in memory while preserving Firebase user for Quick Unlock)
  const lockVault = useCallback(() => {
    setInactivitySecondsLeft(null);
    setMek(null);
    setVaultUnlocked(false);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setInactivitySecondsLeft((prev) => (prev !== null ? null : prev));
  }, []);

  // Auto-lock vault after 60s of inactivity (warning banner shown at 30s)
  useEffect(() => {
    if (!vaultUnlocked) {
      setInactivitySecondsLeft(null);
      return undefined;
    }

    lastActivityRef.current = Date.now();
    const activityEvents = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel"
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_LIMIT_MS) {
        lockVault();
      } else if (elapsed >= INACTIVITY_WARNING_MS) {
        const remaining = Math.max(
          1,
          Math.ceil((INACTIVITY_LIMIT_MS - elapsed) / 1000)
        );
        setInactivitySecondsLeft(remaining);
      } else {
        setInactivitySecondsLeft((prev) => (prev !== null ? null : prev));
      }
    }, 250);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [vaultUnlocked, lockVault, resetInactivityTimer]);

  // Post logout, wipe persisted Quick Unlock MEK & device keys and sign out
  const logout = async () => {
    await disableQuickUnlock();
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
        {vaultUnlocked && inactivitySecondsLeft !== null && (
          <div className="sk-inactivity-backdrop" role="alert">
            <div className="sk-inactivity-banner">
              <div className="sk-inactivity-content">
                <span className="sk-inactivity-orb">
                  <i className="fa-solid fa-hourglass-half" />
                </span>
                <div className="sk-inactivity-text">
                  <span className="sk-inactivity-title">
                    Inactivity detected
                  </span>
                  <span className="sk-inactivity-sub">
                    Auto-locking vault in{" "}
                    <strong>{inactivitySecondsLeft}s</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="sk-inactivity-stay-btn"
                  onClick={resetInactivityTimer}
                >
                  Stay unlocked
                </button>
              </div>
              <div className="sk-inactivity-bar-track" aria-hidden="true">
                <div
                  className="sk-inactivity-bar-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (inactivitySecondsLeft / INACTIVITY_WARNING_WINDOW_SEC) *
                          100
                      )
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}
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

