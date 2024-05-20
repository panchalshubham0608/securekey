import React, { useContext, useEffect, useState } from "react";
import { getPassKeyValue } from "../utils/firestoredb";
import { str2color } from "../utils/str2color";
import AccountIcon from "./AccountIcon";
import UserContext from "../context/UserContext";

export default function KeyItem(props) {
  const userContext = useContext(UserContext);
  const {
    keyItem,
    selected, handleShowKeyBody, handleHideKeyBody,
    showMenu, handleToggleMenu,
    handleEditKey, handleDeleteKey,
    index,
  } = props;
  const [timer, setTimer] = useState(30);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyIconClassName, setCopyIconClassName] = useState("fa-regular fa-copy");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setError("");
    setLoading(true);
    getPassKeyValue({
      userContext,
      account: keyItem.account,
      username: keyItem.username
    }).then(password => {
      // set password and hide it after 30 seconds
      setPassword(password);
      setTimer(30);
      let interval = setInterval(() => {
        setTimer(timer => {
          let newTimer = timer - 1;
          if (newTimer <= 0) {
            clearInterval(interval);
            handleHideKeyBody(index);
            return 0;
          }
          return newTimer;
        });
      }, 1000);
    }).catch(error => {
      console.log("Error getting password", error);
      if (error.message) {
        setError(error.message);
      } else {
        setError("Error: Could not get password");
      }
    }).finally(() => {
      setLoading(false);
    });

  }, [selected, keyItem.account, keyItem.username, handleHideKeyBody, index]);

  // utility function to copy password to clipboard
  const handleCopyPassword = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(password);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Failed to copy password to clipboard", err);
      }
      textArea.remove();
    }
    setCopyIconClassName("fa-solid fa-check");
    setTimeout(() => {
      setCopyIconClassName("fa-regular fa-copy");
    }, 1000);
  };

  const hasExpired = () => {
    // if updatedAt is more than 6 months ago, the key has expired
    let updatedAt = keyItem.updatedAt;
    let sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
    return updatedAt < sixMonthsAgo;
  }

  return (
    <div>
      {
        // non-interactive elements with click handlers must have at least one keyboard event listener
        //eslint-disable-next-line
        <div className="key-container mb-3 merriweather-light" data-testid="key-item"
          style={{ borderTop: `5px solid ${str2color(keyItem.account)}` }}
          onClick={() => handleShowKeyBody(index)}>
          <div className="mb-3 d-flex align-items-start justify-content-between">
            <div className="d-flex align-items-center">
              <AccountIcon account={keyItem.account} />
              <div>
                <p className="key-account m-0" data-testid="key-account">
                  {keyItem.account}
                  {hasExpired() && <span className="ml-3 badge text-bg-danger">Expired</span>}
                </p>
                <p className="key-username m-0" data-testid="key-username">{keyItem.username}</p>
              </div>
            </div>
            <div className="key-action">
              <button className="btn merriweather-light"
                onClick={e => handleToggleMenu(e, index)}>
                <i className="fa-solid fa-ellipsis"></i>
              </button>
              {showMenu &&
                <ul>
                  {
                    // non-interactive elements with click handlers must have at least one keyboard event listener
                    //eslint-disable-next-line
                    <li onClick={e => {
                      // do not let the click event bubble up to the parent div
                      e.preventDefault();
                      e.stopPropagation();
                      // show the edit key dialog
                      handleEditKey(keyItem);
                    }}>Edit</li>}
                  {
                    // non-interactive elements with click handlers must have at least one keyboard event listener
                    //eslint-disable-next-line
                    <li onClick={e => {
                      // do not let the click event bubble up to the parent div
                      e.preventDefault();
                      e.stopPropagation();
                      // show the delete confirm dialog
                      setShowDeleteConfirm(true);
                    }}>Delete</li>}
                </ul>}
            </div>
          </div>
          {selected &&
            <div className="key-body">
              {loading ?
                <div className="d-flex justify-content-center mt-3">
                  <div className="spinner-border" role="status" style={{
                    borderColor: str2color(keyItem.account),
                    borderRightColor: "transparent"
                  }}>
                  </div>
                </div> :
                <div>
                  {error ?
                    <p className="text-danger text-center m-0">{error}</p> :
                    <div>
                      <div className="d-flex justify-content-center">
                        <div className="shrinking-div"></div>
                      </div>
                      <div className="d-flex align-items-center justify-content-center mt-3">
                        <p className="m-0 passkey">{password}</p>
                        <button className="btn merriweather-light text-primary"
                          onClick={handleCopyPassword}><i className={copyIconClassName}></i> Copy</button>
                      </div>
                      <p className="text-center m-0"><strong>{timer}s</strong> until hide</p>
                    </div>}
                </div>}
            </div>}
        </div>}
      {showDeleteConfirm && <div className="delete-confirm-container">
        <div className="delete-confirm">
          <p className="m-0 merriweather-light">Are you sure you want to <strong>delete</strong> this key?</p>
          <div>
            <p className="m-0 merriweather-light"><strong>Account:</strong> {keyItem.account}</p>
            <p className="m-0 merriweather-light"><strong>Username:</strong> {keyItem.username}</p>
          </div>
          <div className="d-flex justify-content-between mt-3">
            <button className="btn btn-danger merriweather-light mr-3"
              onClick={() => handleDeleteKey(keyItem)}>Delete</button>
            <button className="btn btn-secondary merriweather-light"
              onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        </div>
      </div>}
    </div>
  );
}