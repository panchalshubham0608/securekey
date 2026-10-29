import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getPassKeys } from "../utils/firestoredb";
import { migrate } from "../utils/migration";
import CircularLoader from "./CircularLoader";
import KeyItem from "./KeyItem";
import "./MigrateVault.css";
import MigrationProgress from "./MigrationProgress";

export default function MigrateVault() {
  const { user, mek } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requested, setRequested] = useState(false);
  const [password, setPassword] = useState("");
  const [requestPassword, setRequestPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [migrationInProgress, setMigrationInProgress] = useState(false);
  const [migrationPercent, setMigrationPercent] = useState(0);

  const fetchLegacyPasswords = async () => {
    setLoading(true);
    setItems([]);
    setRequested(true);
    try {
      const keys = await getPassKeys({ username: user.email });
      const unmigrated = keys.filter((k) => !k.migrated);
      setItems(unmigrated);
    } catch (err) {
      setError(err.message || "Failed to fetch keys");
    } finally {
      setLoading(false);
    }
  };

  const migratePasswords = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!password) {
      setFormError("Password is required");
      return;
    }

    setRequestPassword(false);
    setFormError("");
    setError("");
    setSuccess("");
    setMigrationInProgress(true);
    try {
      for (let i = 0; i < items.length; i++) {
        await migrate({ uid: user.uid, itemId: items[i].id, password, mek });
        const percentage = Math.min(100, Math.floor(((i + 1) / items.length) * 100));
        setMigrationPercent(percentage);
      }
      setSuccess("Migration completed successfully!");
      await fetchLegacyPasswords();
    } catch (err) {
      setError(err.message || "Failed to migrate passwords");
    } finally {
      setMigrationInProgress(false);
    }
  };

  return (
    <div className="migrate-container merriweather-light">
      <div className="migrate-card">
        <div className="migrate-header d-flex align-items-center gap-3 mb-3">
          <button
            type="button"
            className="sk-icon-btn"
            aria-label="Back to dashboard"
            onClick={() => navigate("/", { replace: true })}
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div>
            <h4 className="m-0 migrate-title">Security Upgrade</h4>
            <p className="m-0 migrate-subtitle">Master Encryption Key (MEK) Migration</p>
          </div>
        </div>

        {error && (
          <div className="auth-error-banner mb-3" role="alert">
            <i className="fa-solid fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="migrate-success-banner mb-3" role="status">
            <i className="fa-solid fa-circle-check" />
            <span>{success}</span>
          </div>
        )}

        {!requested && (
          <div>
            <p className="migrate-lead">
              We&apos;ve upgraded <strong>SecureKey</strong> to use a{" "}
              <strong>Master Encryption Key (MEK)</strong> for stronger cryptographic
              isolation and instant device-bound protection.
            </p>

            <div className="info-box">
              <h6>
                <i className="fa-solid fa-shield-halved me-2" />
                What&apos;s changing?
              </h6>
              <ul>
                <li>Your passwords will be encrypted with a dedicated 256-bit MEK</li>
                <li>MEK never leaves your device in plaintext</li>
                <li>Faster biometric unlock and stronger security</li>
              </ul>
            </div>

            <div className="info-box warning">
              <h6>
                <i className="fa-solid fa-Bolt me-2" />
                What needs migration?
              </h6>
              <p className="m-0">
                Some of your existing passwords are still encrypted using your login
                password. These need to be re-encrypted once.
              </p>
            </div>

            <button
              type="button"
              className="btn sk-btn-primary w-100 mt-4 d-flex align-items-center justify-content-center gap-2 fetch-passwords-btn"
              onClick={fetchLegacyPasswords}
              disabled={loading}
            >
              <i className="fa-solid fa-magnifying-glass" />
              <span>Fetch passwords to migrate</span>
            </button>
          </div>
        )}

        {loading && <CircularLoader />}

        {items.length > 0 && (
          <>
            <div className="mt-3">
              <p className="keys-count-label mb-2">
                {items.length} item(s) need migration
              </p>
              {items.map((item) => (
                <KeyItem key={item.id} keyItem={item} readOnly />
              ))}
            </div>

            {!loading && (
              <button
                type="button"
                className="btn sk-btn-primary w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setRequestPassword(true)}
              >
                <i className="fa-solid fa-rocket" />
                <span>Migrate now</span>
              </button>
            )}
          </>
        )}

        {requested && !loading && items.length === 0 && (
          <div className="keys-empty-state mt-3">
            <div className="keys-empty-icon">
              <i className="fa-solid fa-circle-check" />
            </div>
            <p className="m-0 keys-empty-title">You&apos;re all set!</p>
            <p className="m-0 keys-empty-subtitle">
              All your passwords are already using the latest MEK-based encryption.
            </p>
          </div>
        )}
      </div>

      {requestPassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="m-0 fw-bold">Confirm Master Password</h5>
              <button
                type="button"
                className="sk-icon-btn"
                aria-label="Close"
                onClick={() => setRequestPassword(false)}
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
            <form action="#" method="post" onSubmit={migratePasswords}>
              <p className="migrate-modal-caption mb-3">
                Your master password is required to decrypt your legacy items and
                re-encrypt them with your MEK.
              </p>
              <div className="mb-3">
                <label htmlFor="password" className="sk-input-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control sk-input"
                  id="password"
                  placeholder="Enter master password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFormError("")}
                />
                {formError && (
                  <div className="form-text text-danger mt-1">{formError}</div>
                )}
              </div>
              <button type="submit" className="btn sk-btn-primary w-100">
                Migrate
              </button>
            </form>
          </div>
        </div>
      )}
      {migrationInProgress && <MigrationProgress percentage={migrationPercent} />}
    </div>
  );
}

