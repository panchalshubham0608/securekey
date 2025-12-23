import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getPassKeys } from "../utils/firestoredb";
import CircularLoader from "./CircularLoader";
import KeyItem from "./KeyItem";
import "./MigrateVault.css";

export default function MigrateVault() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);

  const fetchLegacyPasswords = async () => {
    setLoading(true);
    setItems([]);
    setRequested(true);
    try {
      const keys = await getPassKeys({ username: user.email });
      setItems(keys);
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to fetch keys");
    } finally {
      setLoading(false);
    }
  };

  const migratePasswords = async () => {
    // migrate using MEK
  };

  return (
    <div className="migrate-container merriweather-light">
      <div className="migrate-card">
        <button className="btn" onClick={() => navigate("/", { replace: true })}>
          <i className="fa-solid fa-arrow-left fs-1 mb-3 p-0" />
        </button>
        <h3>🔐 Security Upgrade</h3>

        {!requested && <div>
          <p className="text-muted">
            We&apos;ve upgraded <strong>SecureKey</strong> to use a <strong>Master Encryption Key (MEK)</strong> for better security and device-level protection.
          </p>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="info-box">
            <h6>What&apos;s changing?</h6>
            <ul>
              <li>Your passwords will be encrypted with a dedicated MEK</li>
              <li>MEK never leaves your device</li>
              <li>Faster unlock and better security</li>
            </ul>
          </div>

          <div className="info-box warning">
            <h6>What needs migration?</h6>
            <p>
              Some of your existing passwords are still encrypted using
              your login password. These need to be re-encrypted once.
            </p>
          </div>

          <button
            className="btn btn-secondary w-100 mt-3 d-flex align-items-center justify-content-center fetch-passwords-btn"
            onClick={fetchLegacyPasswords}
            disabled={loading}
          >
            Fetch passwords to migrate
          </button>
        </div>}
        {loading && <CircularLoader />}
        {items.length > 0 && (
          <>
            <div className="mt-4">
              <h6>{items.length} item(s) need migration</h6>
              {items.map(item => <KeyItem key={item.id} keyItem={item} readOnly />)}
            </div>

            <button
              className="btn btn-primary w-100 mt-3"
              onClick={migratePasswords}
            >
              Migrate now
            </button>
          </>
        )}
        {requested && !loading && items.length === 0 && (
          <p className="text-muted text-center">
            🎉 You&apos;re all set!<br />
            All your passwords are already using the latest MEK-based encryption.
          </p>
        )}
      </div>
    </div>
  );
}
