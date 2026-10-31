import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import {
  disableQuickUnlock,
  enableQuickUnlock,
  formatQuickUnlockError,
  isQuickUnlockEnabled,
  isQuickUnlockSupported
} from "../utils/quickunlock/quickUnlockService";
import Modal from "./Modal";

export default function QuickUnlockSetup({ onClose }) {
  const { vaultUnlocked, mek, user } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [hasQuickUnlock, setHasQuickUnlock] = useState(false);

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

  if (!vaultUnlocked) return null;

  if (!isQuickUnlockSupported()) {
    return (
      <Modal header="Quick Unlock" onClose={onClose}>
        <p className="quick-unlock-info m-0" style={{ color: "var(--sk-text-muted)" }}>
          Quick unlock is not supported on this device.
        </p>
      </Modal>
    );
  }

  const handleEnable = async () => {
    setError("");
    setLoading(true);

    try {
      await enableQuickUnlock({ user, mek });
      setSuccess("Quick unlock was successfully enabled.");
      setHasQuickUnlock(true);
    } catch (err) {
      setError(formatQuickUnlockError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setError("");
    setLoading(true);

    try {
      await disableQuickUnlock();
      setSuccess("Quick unlock was successfully disabled.");
      setHasQuickUnlock(false);
    } catch (err) {
      setError(formatQuickUnlockError(err));
    } finally {
      setLoading(false);
    }
  };

  let options = {};
  if (!hasQuickUnlock) {
    options = {
      message:
        "Use your device fingerprint, Face ID, or PIN to unlock your vault without entering your password every time.",
      btnClass: "sk-btn-primary",
      btnHandler: handleEnable,
      btnText: "Enable Quick Unlock",
    };
  } else {
    options = {
      message:
        "Quick unlock is already enabled on this device. Do you wish to disable quick-unlock?",
      btnClass: "btn-danger",
      btnHandler: handleDisable,
      btnText: "Disable Quick Unlock",
    };
  }

  return (
    <Modal header="Quick Unlock" onClose={onClose}>
      <div>
        {success && <p className="migrate-success-banner mb-3">{success}</p>}

        {error && <p className="auth-error-banner mb-3">{error}</p>}
        <p style={{ color: "var(--sk-text-secondary)", fontSize: "0.88rem", lineHeight: 1.5 }}>
          {options.message}
        </p>
        <button
          type="button"
          className={`btn ${options.btnClass} w-100 mt-2`}
          onClick={options.btnHandler}
          disabled={loading}
        >
          {loading ? "Processing...." : options.btnText}
        </button>
      </div>
    </Modal>
  );
}

