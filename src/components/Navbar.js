import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import { useAppContext } from "../context/AppContext";
import "./Navbar.css";
import QuickUnlockSetup from "./QuickUnlockSetup";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAppContext();

  const [open, setOpen] = useState(false);
  const [showQuickUnlockSetup, setShowQuickUnlockSetup] = useState(false);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

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
  ];

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
            className="hamburger-toggle"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label="Open settings sidebar"
            onClick={() => setOpen(true)}
          >
            <i className="fa-solid fa-bars" />
          </button>
        </div>
      </div>

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