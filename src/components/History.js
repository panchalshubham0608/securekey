import React, { useEffect, useState, useContext } from "react";
import UserContext from "../context/UserContext";
import { getHistory } from "../utils/firestoredb";
import AccountIcon from "./AccountIcon";
import "../styles/History.css";
import Loader from "./Loader";

export default function History(props) {
  const userContext = useContext(UserContext);
  const { keyItem, setShowHistoryKeyItem } = props;
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!keyItem) return;
    setLoading(true);
    getHistory({
      userContext,
      account: keyItem.account,
      username: keyItem.username,
    })
      .then((history) => {
        setHistory(history);
      })
      .catch((error) => {
        console.error("Error fetching keys", error);
        if (error.message) {
          setError(error.message);
        } else {
          setError("Error fetching keys");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [keyItem]);

  return (
    <div className="history-container merriweather-light">
      <div className="d-flex align-items-center justify-content-between">
        <h4 className="m-0">History</h4>
        <button
          className="btn fs-3"
          onClick={() => setShowHistoryKeyItem(null)}
        >
          <i className="fa fa-times" />
        </button>
      </div>
      <hr />
      <div className="mb-3 mt-3 d-flex align-items-start justify-content-center">
        <div className="d-flex align-items-center">
          <AccountIcon account={keyItem.account} />
          <div>
            <p className="key-account m-0" data-testid="key-account">
              {keyItem.account}
            </p>
            <p className="key-username m-0" data-testid="key-username">
              {keyItem.username}
            </p>
          </div>
        </div>
      </div>
      <hr />
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <Loader />
      ) : (
        <div className="mt-3">
          {history && history.length ? (
            <div className="list">
              {history.map((lp) => (
                <div key={lp.password} className="list-item border p-3 mt-3">
                  <h5 className="text-break">{lp.password}</h5>
                  <p className="text-muted m-0">{lp.changedAt}</p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-muted text-center">Nothing here yet!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
