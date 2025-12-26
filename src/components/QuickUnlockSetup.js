import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import {
  disableQuickUnlock,
  enableQuickUnlock,
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
        <p className="quick-unlock-info">
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
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Failed to enable quick unlock"
      );
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
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Failed to disable quick unlock"
      );
    } finally {
      setLoading(false);
    }
  }

  let options = {};
  if (!hasQuickUnlock) {
    options = {
      message: "Use your device fingerprint, face ID, or PIN to unlock your vault without entering your password every time.",
      btnClass: "btn-success",
      btnHandler: handleEnable,
      btnText: "Enable Quick Unlock",
    }
  } else {
    options = {
      message: "Quick unlock is already enabled on this device. Do you wish to disable quick-unlock?",
      btnClass: "btn-danger",
      btnHandler: handleDisable,
      btnText: "Disable Quick Unlock",
    }
  }

  return (
    <Modal header="Quick Unlock" onClose={onClose}>
      <div>
        {success && (
          <p className="alert alert-success">{success}</p>
        )}

        {error && (
          <p className="alert alert-danger">{error}</p>
        )}
        <p className="text-muted">{options.message}</p>
        <button
          className={`btn ${options.btnClass} w-100 mt-3`}
          onClick={options.btnHandler}
          disabled={loading}
        >
          {loading ? "Processing...." : options.btnText}
        </button>
      </div>
    </Modal>
  );
}
