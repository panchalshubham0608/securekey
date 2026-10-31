import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import { useAppContext } from "../context/AppContext";
import AccountIcon from "./AccountIcon";
import "./Navbar.css";
import QuickUnlockSetup from "./QuickUnlockSetup";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROTATION_PERIOD_MS = 6 * 30 * DAY_MS; // 180 days (6 months)
const EXPIRING_SOON_WINDOW_MS = 30 * DAY_MS; // 30 days before expiration (150-180 days)

export default function Navbar({ keys = [] }) {
  const navigate = useNavigate();
  const { user, lockVault, logout } = useAppContext();

  const [open, setOpen] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showQuickUnlockSetup, setShowQuickUnlockSetup] = useState(false);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowInsights(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const summary = useMemo(() => {
    const now = Date.now();
    const needsRotation = [];
    const expiringSoon = [];
    let healthyCount = 0;

    keys.forEach((item) => {
      const updatedAt = Number(item.updatedAt) || now;
      const ageMs = Math.max(0, now - updatedAt);
      const ageDays = Math.floor(ageMs / DAY_MS);

      if (ageMs >= ROTATION_PERIOD_MS) {
        needsRotation.push({
          ...item,
          ageDays,
          overdueDays: Math.max(1, Math.floor((ageMs - ROTATION_PERIOD_MS) / DAY_MS))
        });
      } else if (ageMs >= ROTATION_PERIOD_MS - EXPIRING_SOON_WINDOW_MS) {
        const daysLeft = Math.max(
          1,
          Math.ceil((ROTATION_PERIOD_MS - ageMs) / DAY_MS)
        );
        expiringSoon.push({
          ...item,
          ageDays,
          daysLeft
        });
      } else {
        healthyCount += 1;
      }
    });

    const total = keys.length;
    const attentionCount = needsRotation.length + expiringSoon.length;
    const healthScore =
      total === 0
        ? 100
        : Math.round(
          ((healthyCount + expiringSoon.length * 0.6) / total) * 100
        );

    return {
      total,
      needsRotation,
      expiringSoon,
      healthyCount,
      attentionCount,
      healthScore
    };
  }, [keys]);

  const handleLockVault = () => {
    lockVault();
    navigate("/login", { replace: true });
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/welcome", { replace: true });
  };

  const menuItems = [
    {
      key: "quickUnlock",
      label: "Quick Unlock",
      description: "Biometric or passkey access",
      icon: <i className="fa-solid fa-fingerprint" />,
      onClick: () => setShowQuickUnlockSetup(true),
    },
    {
      key: "migrate",
      label: "Migrate",
      description: "Upgrade legacy passwords",
      icon: <i className="fa-solid fa-rocket" />,
      onClick: () => navigate("/migrate"),
    },
    {
      key: "lockVault",
      label: "Lock Vault",
      description: "Lock session & require unlock",
      icon: <i className="fa-solid fa-lock" />,
      onClick: handleLockVault,
    },
  ];

  const badgeTone =
    summary.needsRotation.length > 0
      ? "is-danger"
      : summary.expiringSoon.length > 0
        ? "is-warning"
        : "is-healthy";

  const healthyPct =
    summary.total > 0 ? (summary.healthyCount / summary.total) * 100 : 100;
  const expiringPct =
    summary.total > 0 ? (summary.expiringSoon.length / summary.total) * 100 : 0;
  const expiredPct =
    summary.total > 0
      ? (summary.needsRotation.length / summary.total) * 100
      : 0;

  return (
    <div>
      <div
        className="custom-navbar d-flex align-items-center justify-content-between"
        data-testid="navbar"
      >
        <div className="d-flex align-items-center gap-2">
          <div className="navbar-logo-wrap">
            <img src={Logo} alt="logo" />
          </div>
          <h4 className="m-0 sedgwick-ave-display-regular navbar-brand-title">
            SecureKey
          </h4>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className={`navbar-insights-btn ${showInsights ? "is-active" : ""}`}
            aria-haspopup="dialog"
            aria-expanded={showInsights}
            aria-label="Open password health summary"
            title="Password health & rotation summary"
            onClick={() => {
              setOpen(false);
              setShowInsights((prev) => !prev);
            }}
          >
            <i className="fa-solid fa-shield-halved" />
            {summary.attentionCount > 0 ? (
              <span className={`navbar-insights-badge ${badgeTone}`}>
                {summary.attentionCount}
              </span>
            ) : (
              <span className="navbar-insights-dot" />
            )}
          </button>

          <button
            type="button"
            className="hamburger-toggle"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label="Open settings sidebar"
            onClick={() => {
              setShowInsights(false);
              setOpen(true);
            }}
          >
            <i className="fa-solid fa-bars" />
          </button>
        </div>
      </div>

      {showInsights && (
        <div className="sk-insights-root">
          <div
            className="sk-insights-backdrop"
            onClick={() => setShowInsights(false)}
            aria-hidden="true"
          />
          <div
            className="sk-insights-popup"
            role="dialog"
            aria-label="Password health summary"
          >
            <div className="sk-insights-header">
              <div className="d-flex align-items-center gap-2">
                <span className="sk-insights-header-icon">
                  <i className="fa-solid fa-shield-halved" />
                </span>
                <div>
                  <h6 className="sk-insights-title m-0">Password Health</h6>
                  <span className="sk-insights-subtitle">
                    {summary.total}{" "}
                    {summary.total === 1 ? "account" : "accounts"} monitored
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className={`sk-insights-score-pill ${badgeTone}`}>
                  {summary.healthScore}% Healthy
                </span>
                <button
                  type="button"
                  className="sk-sidebar-close"
                  aria-label="Close password health popup"
                  onClick={() => setShowInsights(false)}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            <div className="sk-insights-progress" aria-hidden="true">
              <span
                className="sk-insights-bar is-healthy"
                style={{ width: `${healthyPct}%` }}
              />
              <span
                className="sk-insights-bar is-warning"
                style={{ width: `${expiringPct}%` }}
              />
              <span
                className="sk-insights-bar is-danger"
                style={{ width: `${expiredPct}%` }}
              />
            </div>

            <div className="sk-insights-stats-grid">
              <div className="sk-insights-stat-card is-danger">
                <div className="sk-insights-stat-top">
                  <i className="fa-solid fa-rotate" />
                  <span className="sk-insights-stat-value">
                    {summary.needsRotation.length}
                  </span>
                </div>
                <span className="sk-insights-stat-label">Needs Rotation</span>
                <span className="sk-insights-stat-hint">&gt; 6 months old</span>
              </div>

              <div className="sk-insights-stat-card is-warning">
                <div className="sk-insights-stat-top">
                  <i className="fa-regular fa-clock" />
                  <span className="sk-insights-stat-value">
                    {summary.expiringSoon.length}
                  </span>
                </div>
                <span className="sk-insights-stat-label">Expiring Soon</span>
                <span className="sk-insights-stat-hint">Within 30 days</span>
              </div>

              <div className="sk-insights-stat-card is-healthy">
                <div className="sk-insights-stat-top">
                  <i className="fa-solid fa-circle-check" />
                  <span className="sk-insights-stat-value">
                    {summary.healthyCount}
                  </span>
                </div>
                <span className="sk-insights-stat-label">Up to Date</span>
                <span className="sk-insights-stat-hint">Fresh &amp; active</span>
              </div>
            </div>

            {summary.attentionCount > 0 ? (
              <div className="sk-insights-list-section">
                <span className="sk-insights-section-title">
                  Recommended Actions ({summary.attentionCount})
                </span>
                <div className="sk-insights-list">
                  {summary.needsRotation.map((item) => (
                    <div key={item.id} className="sk-insights-item">
                      <div className="sk-insights-item-main">
                        <div className="sk-insights-item-avatar">
                          <AccountIcon
                            account={item.account}
                            username={item.username}
                          />
                        </div>
                        <div className="sk-insights-item-info">
                          <div className="d-flex align-items-center gap-2">
                            <span className="sk-insights-item-account">
                              {item.account}
                            </span>
                            <span className="sk-insights-tag is-danger">
                              Expired · {item.ageDays}d
                            </span>
                          </div>
                          <span className="sk-insights-item-user">
                            {item.username}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="sk-insights-rotate-btn is-danger"
                        onClick={() => {
                          setShowInsights(false);
                          navigate(`/edit/${item.id}`);
                        }}
                      >
                        <span className="sk-insights-btn-orb">
                          <i className="fa-solid fa-rotate sk-insights-btn-icon" />
                        </span>
                        <span className="sk-insights-btn-text">Rotate</span>
                        <i className="fa-solid fa-chevron-right sk-insights-btn-arrow" />
                      </button>
                    </div>
                  ))}

                  {summary.expiringSoon.map((item) => (
                    <div key={item.id} className="sk-insights-item">
                      <div className="sk-insights-item-main">
                        <div className="sk-insights-item-avatar">
                          <AccountIcon
                            account={item.account}
                            username={item.username}
                          />
                        </div>
                        <div className="sk-insights-item-info">
                          <div className="d-flex align-items-center gap-2">
                            <span className="sk-insights-item-account">
                              {item.account}
                            </span>
                            <span className="sk-insights-tag is-warning">
                              In {item.daysLeft}d
                            </span>
                          </div>
                          <span className="sk-insights-item-user">
                            {item.username}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="sk-insights-rotate-btn is-warning"
                        onClick={() => {
                          setShowInsights(false);
                          navigate(`/edit/${item.id}`);
                        }}
                      >
                        <span className="sk-insights-btn-orb">
                          <i className="fa-solid fa-bolt sk-insights-btn-icon" />
                        </span>
                        <span className="sk-insights-btn-text">Update</span>
                        <i className="fa-solid fa-chevron-right sk-insights-btn-arrow" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sk-insights-all-clear">
                <div className="sk-insights-clear-orb">
                  <i className="fa-solid fa-shield-heart" />
                </div>
                <div>
                  <p className="sk-insights-clear-title m-0">
                    All passwords are up to date
                  </p>
                  <p className="sk-insights-clear-sub m-0">
                    None of your saved passwords need rotation right now.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {open && (
        <div className="sk-sidebar-root">
          <div
            className="sk-sidebar-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="sk-sidebar" aria-label="Settings sidebar">
            <div className="sk-sidebar-header">
              <div className="sk-sidebar-user">
                <div className="sk-sidebar-avatar">
                  <i className="fa-regular fa-user" />
                </div>
                <div className="sk-sidebar-user-info">
                  <h6 className="sk-sidebar-title m-0">Settings</h6>
                  {user?.email && (
                    <span className="sk-sidebar-email" title={user.email}>
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="sk-sidebar-close"
                aria-label="Close settings sidebar"
                onClick={() => setOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="sk-sidebar-body">
              <span className="sk-sidebar-section-label">Security & Tools</span>
              <div className="sk-sidebar-list" role="menu">
                {menuItems.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    className="sk-sidebar-item"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      item.onClick();
                    }}
                  >
                    <span className="sk-sidebar-item-icon">{item.icon}</span>
                    <span className="sk-sidebar-item-content">
                      <span className="sk-sidebar-item-label">{item.label}</span>
                      {item.description && (
                        <span className="sk-sidebar-item-desc">
                          {item.description}
                        </span>
                      )}
                    </span>
                    <i className="fa-solid fa-chevron-right sk-sidebar-chevron" />
                  </button>
                ))}
              </div>
            </div>

            <div className="sk-sidebar-footer">
              <button
                type="button"
                className="sk-sidebar-logout"
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
                }}
              >
                <i className="fa-solid fa-right-from-bracket" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {showQuickUnlockSetup && (
        <QuickUnlockSetup onClose={() => setShowQuickUnlockSetup(false)} />
      )}
    </div>
  );
}