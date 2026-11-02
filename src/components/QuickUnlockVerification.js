import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "../assets/images/logo.svg";
import { useAppContext } from "../context/AppContext";
import {
  formatQuickUnlockError,
  getQuickUnlockUser,
  quickUnlock
} from "../utils/quickunlock/quickUnlockService";
import Modal from "./Modal";

/**
 * QuickUnlockVerification Component
 * Allows users to authenticate using WebAuthn (fingerprint / PIN) to unlock vault.
 */
export default function QuickUnlockVerification({ onClose }) {
  const {
    user,
    vaultUnlocked,
    unlockVault
  } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoTriggeredRef = useRef(false);

  const activeUser = user || getQuickUnlockUser();

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  /**
   * Trigger WebAuthn authentication (login)
   */
  const handleAuthenticate = useCallback(async () => {
    if (!window.PublicKeyCredential) return;
    setLoading(true);
    setError("");
    try {
      const mek = await quickUnlock();
      if (!mek) {
        setError("Quick unlock is not configured on this device.");
        return;
      }
      unlockVault({ mek, user: activeUser });
      handleClose();
    } catch (err) {
      setError(formatQuickUnlockError(err));
    } finally {
      setLoading(false);
    }
  }, [activeUser, handleClose, unlockVault]);

  useEffect(() => {
    if (!vaultUnlocked && activeUser && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleAuthenticate();
    }
  }, [vaultUnlocked, activeUser, handleAuthenticate]);

  if (vaultUnlocked) return null;
  if (!activeUser) return null;

  return (
    <Modal header="Biometric Unlock" onClose={handleClose}>
      {error && (
        <div className="auth-error-banner mb-3" role="alert">
          <i className="fa-solid fa-circle-exclamation" />
          <span>{error}</span>
        </div>
      )}
      <div className="d-flex align-items-center justify-content-between flex-column merriweather-light text-center py-2">
        <div className="auth-logo-badge mb-2">
          <img width={36} src={Logo} alt="logo" />
        </div>
        <h4 className="m-0 sedgwick-ave-display-regular auth-brand-title">
          SecureKey
        </h4>
        <p className="fs-6 fw-semibold mt-3 mb-1 text-wrap text-break">
          Hi, {activeUser.displayName || activeUser.email}
        </p>
        <p style={{ color: "var(--sk-text-muted)", fontSize: "0.84rem" }} className="mb-3">
          {loading
            ? "Verifying with Touch ID, Face ID, or Device PIN..."
            : "Tap the fingerprint sensor below to unlock your vault."}
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

