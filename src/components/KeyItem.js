import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { str2color } from "../utils/str2color";
import { getPasswordByAccountAndUsername } from "../utils/vault/vaultService";
import AccountIcon from "./AccountIcon";
import CircularLoader from "./CircularLoader";

export default function KeyItem(props) {
  const { user, mek } = useAppContext();
  const navigate = useNavigate();
  const {
    readOnly,
    keyItem,
    selected,
    trayOpen,
    onSetTrayOpen,
    handleShowKeyBody,
    handleHideKeyBody,
    handleDeleteKey,
    index,
  } = props;
  const [timer, setTimer] = useState(30);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyIconClassName, setCopyIconClassName] =
    useState("fa-regular fa-copy");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const touchStartXRef = useRef(null);
  const didSwipeRef = useRef(false);

  useEffect(() => {
    if (!selected) return;
    let intervalId = null;
    setError("");
    setLoading(true);
    getPasswordByAccountAndUsername({
      uid: user.uid,
      account: keyItem.account,
      username: keyItem.username,
      mek
    })
      .then((decryptedPassword) => {
        setPassword(decryptedPassword);
        setTimer(30);
        intervalId = setInterval(() => {
          setTimer((prevTimer) => {
            const newTimer = prevTimer - 1;
            if (newTimer <= 0) {
              clearInterval(intervalId);
              handleHideKeyBody(index);
              return 0;
            }
            return newTimer;
          });
        }, 1000);
      })
      .catch((err) => {
        if (err && err.message) {
          setError(err.message);
        } else {
          setError("Error: Could not get password");
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selected, keyItem.account, keyItem.username, handleHideKeyBody, index, user.uid, mek]);

  // utility function to copy password to clipboard
  const handleCopyPassword = (e) => {
    if (e) {
      e.stopPropagation();
    }
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
        // Ignore clipboard fallback error
      }
      textArea.remove();
    }
    setCopyIconClassName("fa-solid fa-check");
    setTimeout(() => {
      setCopyIconClassName("fa-regular fa-copy");
    }, 1200);
  };

  const hasExpired = () => {
    // if updatedAt is more than 6 months ago, the key has expired
    const updatedAt = keyItem.updatedAt;
    const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
    return updatedAt < sixMonthsAgo;
  };

  const handleTouchStart = (e) => {
    if (readOnly) return;
    touchStartXRef.current = e.touches[0].clientX;
    didSwipeRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (readOnly || touchStartXRef.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 10) {
      didSwipeRef.current = true;
    }
    const baseOffset = trayOpen ? -192 : 0;
    const nextOffset = Math.max(-204, Math.min(0, baseOffset + deltaX));
    setDragOffsetX(nextOffset - baseOffset);
  };

  const handleTouchEnd = (e) => {
    if (readOnly || touchStartXRef.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    setDragOffsetX(0);

    if (deltaX < -35 && !trayOpen && onSetTrayOpen) {
      onSetTrayOpen(true);
    } else if (deltaX > 35 && trayOpen && onSetTrayOpen) {
      onSetTrayOpen(false);
    }
  };

  const accentColor = str2color(keyItem.account);
  const isCopied = copyIconClassName.includes("check");
  const baseTranslate = trayOpen ? -192 : 0;
  const currentTranslate = Math.max(-204, Math.min(0, baseTranslate + dragOffsetX));

  return (
    <div>
      <div className="key-swipe-wrapper mb-3" data-key-index={index}>
        {!readOnly && (
          <div
            className={`key-side-tray ${trayOpen || dragOffsetX < -10 ? "is-visible" : ""}`}
            aria-hidden={!trayOpen}
          >
            <button
              type="button"
              className="key-tray-tile key-tray-history"
              tabIndex={trayOpen ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                if (onSetTrayOpen) onSetTrayOpen(false);
                navigate(`/history/${keyItem.id}`, { replace: true });
              }}
            >
              <i className="fa-solid fa-clock-rotate-left" />
              <span>History</span>
            </button>
            <button
              type="button"
              className="key-tray-tile key-tray-edit"
              tabIndex={trayOpen ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                if (onSetTrayOpen) onSetTrayOpen(false);
                navigate(`/edit/${keyItem.id}`, { replace: true });
              }}
            >
              <i className="fa-solid fa-pen-to-square" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="key-tray-tile key-tray-delete"
              tabIndex={trayOpen ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                if (onSetTrayOpen) onSetTrayOpen(false);
                setShowDeleteConfirm(true);
              }}
            >
              <i className="fa-solid fa-trash-can" />
              <span>Delete</span>
            </button>
          </div>
        )}

        {
          // non-interactive elements with click handlers must have at least one keyboard event listener
          //eslint-disable-next-line
          <div
            className={`key-container merriweather-light ${
              selected ? "key-container-selected" : ""
            } ${trayOpen ? "key-container-slid" : ""}`}
            data-testid="key-item"
            style={{
              borderTop: `3px solid ${accentColor}`,
              "--key-accent": accentColor,
              transform: `translateX(${currentTranslate}px)`
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (didSwipeRef.current) {
                didSwipeRef.current = false;
                return;
              }
              if (!readOnly) {
                handleShowKeyBody(index);
              }
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3 key-main-info">
                <div className="account-logo-wrapper">
                  <AccountIcon account={keyItem.account} />
                </div>
                <div className="key-text-group">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <p className="key-account m-0" data-testid="key-account">
                      {keyItem.account}
                    </p>
                    {hasExpired() && (
                      <span className="sk-badge sk-badge-danger">Expired</span>
                    )}
                  </div>
                  <p className="key-username m-0 text-break" data-testid="key-username">
                    {keyItem.username}
                  </p>
                </div>
              </div>

              {!readOnly && (
                <button
                  type="button"
                  className={`key-slide-handle ${trayOpen ? "is-open" : ""}`}
                  aria-label={trayOpen ? "Close item actions" : "Slide out item actions"}
                  title={trayOpen ? "Close actions" : "Actions"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSetTrayOpen) {
                      onSetTrayOpen(!trayOpen);
                    }
                  }}
                >
                  <span className="key-handle-bar" />
                  <span className="key-handle-bar" />
                </button>
              )}
            </div>

            {selected && (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                className="key-body mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {loading ? (
                  <CircularLoader borderColor={accentColor} />
                ) : (
                  <div>
                    {error ? (
                      <p className="key-error-msg text-center m-0">{error}</p>
                    ) : (
                      <div>
                        <div className="key-timer-bar-row">
                          <div className="shrinking-bar-track">
                            <div className="shrinking-div" />
                          </div>
                          <span className="key-timer-pill">
                            <i className="fa-regular fa-clock" />
                            <span>{timer}s</span>
                          </span>
                        </div>

                        <div className="key-secret-box is-revealed mt-2">
                          <p className="m-0 passkey passkey-revealed font-mono">
                            {password}
                          </p>
                          <div className="key-secret-actions">
                            <button
                              type="button"
                              className={`key-copy-btn merriweather-light ${
                                isCopied ? "is-copied" : ""
                              }`}
                              onClick={handleCopyPassword}
                            >
                              <i className={copyIconClassName} />
                              <span>{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        }
      </div>
      {showDeleteConfirm && (
        <div className="delete-confirm-container">
          <div className="delete-confirm">
            <div className="delete-confirm-header">
              <div className="delete-warning-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <p className="m-0 merriweather-light delete-confirm-title">
                Are you sure you want to <strong>delete</strong> this key?
              </p>
            </div>
            <div className="delete-confirm-meta">
              <p className="m-0 merriweather-light">
                <strong>Account:</strong> {keyItem.account}
              </p>
              <p className="m-0 merriweather-light">
                <strong>Username:</strong> {keyItem.username}
              </p>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn sk-btn-ghost merriweather-light"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger delete-confirm-btn merriweather-light"
                onClick={() => handleDeleteKey(keyItem)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

