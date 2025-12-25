import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import { useAppContext } from "../context/AppContext";
import "./Navbar.css";
import QuickUnlockSetup from "./QuickUnlockSetup";

export default function Navbar() {
  const navigate = useNavigate();
  const { logout } = useAppContext();

  const [open, setOpen] = useState(false);
  const [showQuickUnlockSetup, setShowQuickUnlockSetup] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleSignOut = async () => {
    await logout();
    navigate("/welcome", { replace: true });
  }

  const menuItems = [
    {
      key: "quickUnlock",
      label: "Quick Unlock",
      icon: <i className="fa-solid fa-fingerprint"></i>,
      onClick: () => setShowQuickUnlockSetup(true),
    },
    {
      key: "migrate",
      label: "Migrate",
      icon: <i className="fa-solid fa-rocket"></i>,
      onClick: () => navigate("/migrate"),
    },

    {
      key: "logout",
      label: "Logout",
      icon: <i className="fa-solid fa-sign-out"></i>,
      onClick: handleSignOut,
    }
  ];

  return (
    <div>
      <div className="hamburger-root hamburger-left" ref={rootRef}>
        <button
          className="hamburger-toggle"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        {open && (
          <div className="hamburger-menu" role="menu">
            {menuItems.map((item) => (
              <button
                key={item.key}
                className={`hamburger-item ${item.destructive ? "destructive" : ""}`}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.icon && <span className="hamburger-icon">{item.icon}</span>}
                {item.ticked && <span className="hamburger-tick">✔</span>}
                <span className="hamburger-text">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="custom-navbar mb-3 d-flex align-items-center justify-content-between" data-testid="navbar">
        <div className="d-flex align-items-center">
          <img src={Logo} alt="logo" />
          <h4 className="m-0 text-primary sedgwick-ave-display-regular">SecureKey</h4>
        </div>
      </div>

      {showQuickUnlockSetup && <QuickUnlockSetup onClose={() => setShowQuickUnlockSetup(false)} />}
    </div>

  );
}