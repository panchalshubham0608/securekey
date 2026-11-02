import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { formatFirestoreTimestamp } from "../utils/dateutil";
import { getVaultItemHistory } from "../utils/vault/vaultService";
import AccountIcon from "./AccountIcon";
import Loader from "./Loader";
import "./VaultItemChangeHistory.css";

export default function VaultItemChangeHistory() {
  const { user, mek } = useAppContext();
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [keyWithHistory, setKeyWithHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(-1);

  const fetchHistory = useCallback(async () => {
    if (!itemId || !user || !mek) return;

    setLoading(true);
    setError("");

    try {
      const result = await getVaultItemHistory({
        uid: user.uid,
        itemId,
        mek
      });
      setKeyWithHistory(result);
    } catch (err) {
      setError(err?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [itemId, user, mek]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCopyHistoricalPassword = (pwd, index) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pwd);
    }
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(-1);
    }, 1200);
  };

  if (loading) {
    return <Loader visible message="Loading password history..." />;
  }

  if (error) {
    return (
      <div className="history-container merriweather-light">
        <div className="auth-error-banner">{error}</div>
        <button
          type="button"
          className="btn sk-btn-ghost"
          onClick={() => navigate("/", { replace: true })}
        >
          Go back
        </button>
      </div>
    );
  }

  if (!keyWithHistory) {
    return null;
  }

  const { account, username, history = [] } = keyWithHistory;

  return (
    <div className="history-container merriweather-light">
      <div className="history-header d-flex align-items-center gap-3">
        <button
          type="button"
          className="sk-icon-btn"
          onClick={() => navigate("/", { replace: true })}
          aria-label="Close history"
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div>
          <h4 className="m-0 history-title">Password History</h4>
          <p className="m-0 history-subtitle">Audit log of previous credentials</p>
        </div>
      </div>

      <div className="history-account-card mt-3 mb-3">
        <div className="account-logo-wrapper">
          <AccountIcon account={account} username={username} />
        </div>
        <div className="key-text-group">
          <p className="key-account m-0">{account}</p>
          <p className="key-username m-0">{username}</p>
        </div>
      </div>

      <div className="mt-3">
        {history.length > 0 ? (
          <div className="history-timeline">
            {history.map((entry, index) => (
              <div
                key={`${entry.changedAt}-${index}`}
                className="history-item-card"
              >
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <h5 className="m-0 font-mono text-break history-password">
                    {entry.password}
                  </h5>
                  <button
                    type="button"
                    className="key-copy-btn"
                    onClick={() => handleCopyHistoricalPassword(entry.password, index)}
                  >
                    <i
                      className={
                        copiedIndex === index
                          ? "fa-solid fa-check"
                          : "fa-regular fa-copy"
                      }
                    />
                    <span>{copiedIndex === index ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="history-timestamp m-0 mt-2">
                  <i className="fa-regular fa-calendar me-1" />
                  {formatFirestoreTimestamp(entry.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="keys-empty-state">
            <div className="keys-empty-icon">
              <i className="fa-solid fa-clock-rotate-left" />
            </div>
            <p className="m-0 keys-empty-title">Nothing here yet!</p>
            <p className="m-0 keys-empty-subtitle">
              Previous passwords will appear here when you rotate this credential.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

