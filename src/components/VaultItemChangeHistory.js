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
      console.error("Error fetching history", err);
      setError(err?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [itemId, user, mek]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return <Loader visible />;
  }

  if (error) {
    return (
      <div className="history-container merriweather-light">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-link" onClick={() => navigate("/", { replace: true })}>
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
      <div className="d-flex align-items-center">
        <button
          className="btn fs-3"
          onClick={() => navigate("/", { replace: true })}
          aria-label="Close history"
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h4 className="m-0">History</h4>
      </div>

      <hr />

      <div className="mb-3 mt-3 d-flex justify-content-center">
        <div className="d-flex align-items-center">
          <AccountIcon account={account} />
          <div>
            <p className="key-account m-0">{account}</p>
            <p className="key-username m-0">{username}</p>
          </div>
        </div>
      </div>

      <hr />

      <div className="mt-3">
        {history.length > 0 ? (
          <div className="list">
            {history.map((entry, index) => (
              <div
                key={`${entry.changedAt}-${index}`}
                className="list-item border p-3 mt-3"
              >
                <h5 className="text-break">{entry.password}</h5>
                <p className="text-muted m-0">
                  {formatFirestoreTimestamp(entry.changedAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-center">Nothing here yet!</p>
        )}
      </div>
    </div>
  );
}
