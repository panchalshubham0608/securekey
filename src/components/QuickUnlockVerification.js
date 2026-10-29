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
      setError(err?.message || "Failed to authenticate with quick unlock");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (cancelled) return null;
  if (!hasQuickUnlock) return null;

  return (
    <Modal header="Biometric Unlock" onClose={() => setCancelled(true)}>
      {error && <p className="auth-error-banner mb-3">{error}</p>}
      <div className="d-flex align-items-center justify-content-between flex-column merriweather-light text-center py-2">
        <div className="auth-logo-badge mb-2">
          <img width={36} src={Logo} alt="logo" />
        </div>
        <h4 className="m-0 sedgwick-ave-display-regular auth-brand-title">
          SecureKey
        </h4>
        <p className="fs-6 fw-semibold mt-3 mb-1 text-wrap text-break">
          Hi, {user.displayName || user.email}
        </p>
        <p style={{ color: "var(--sk-text-muted)", fontSize: "0.84rem" }} className="mb-3">
          Use Touch ID, Face ID, or Device PIN to unlock your vault.
        </p>
        <button
          type="button"
          className="btn sk-btn-primary d-flex align-items-center justify-content-center"
          style={{ width: "68px", height: "68px", borderRadius: "20px" }}
          aria-label="Authenticate with biometrics"
          onClick={handleAuthenticate}
          disabled={loading || !window.PublicKeyCredential}
        >
          <i className="fa-solid fa-fingerprint fs-2" />
        </button>

        {!window.PublicKeyCredential && (
          <p className="text-danger mt-2 mb-0" style={{ fontSize: "0.8rem" }}>
            WebAuthn not supported in this browser.
          </p>
        )}
      </div>
    </Modal>
  );
}

