import { useEffect, useState } from "react";
import Logo from "../assets/images/logo.svg";
import { useAppContext } from "../context/AppContext";
import { isQuickUnlockEnabled, quickUnlock } from "../utils/quickunlock/quickUnlockService";
import Modal from "./Modal";

/**
 * QuickUnlockVerification Component
 * Allows users to authenticate using WebAuthn (fingerprint / PIN) to unlock vault.
 */
export default function QuickUnlockVerification() {
  const { user, unlockVault } = useAppContext();
  const [cancelled, setCancelled] = useState(false);
  const [hasQuickUnlock, setHasQuickUnlock] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const checkQuickUnlock = async () => {
      const enabled = await isQuickUnlockEnabled();
      if (isMounted) {
        setHasQuickUnlock(enabled);
      }
    };

    checkQuickUnlock();

    return () => {
      isMounted = false;
    };
  }, []);


  /**
   * Trigger WebAuthn authentication (login)
   */
  const handleAuthenticate = async () => {
    setLoading(true);
    setError("");
    try {
      const mek = await quickUnlock();
      if (!mek) {
        setError("Failed to authenticate with quick unlock");
        return;
      }
      unlockVault({ mek });
      setCancelled(true);
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Failed to authenticate with quick unlock"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (cancelled) return null;
  if (!hasQuickUnlock) return null;

  return (
    <Modal onClose={() => setCancelled(true)} >
      {error && <p className="alert alert-danger">{error}</p>}
      <div className="d-flex align-items-center justify-content-between flex-column merriweather-light">
        <img width={60} src={Logo} alt="logo" />
        <h4 className="m-0 text-primary sedgwick-ave-display-regular">SecureKey</h4>
        <p className="fs-3 mt-3 text-wrap text-break text-center">Hi, {user.displayName || user.email}</p>
        <p className="text-muted mt-1">Use Touch ID / Face ID to Login.</p>
        <button
          className="btn btn-lg"
          onClick={handleAuthenticate}
          disabled={loading || !window.PublicKeyCredential}
        >
          <i className="fa-solid fa-fingerprint fs-1"></i>
        </button>

        {!window.PublicKeyCredential && (
          <p className="text-danger">WebAuthn not supported in this browser.</p>
        )}
      </div>
    </Modal>
  );
}
