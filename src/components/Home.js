import { useState } from "react";
import { Navigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import "../styles/Home.css";

export default function Home() {
  const [navigate, setNavigate] = useState(null);

  if (navigate) {
    return navigate;
  }

  return (
    <div className="home-container">
      <div className="home merriweather-light">
        <div className="home-hero-emblem">
          <div className="home-emblem-glow" />
          <div className="home-emblem-ring">
            <img src={Logo} alt="logo" width="54" height="54" />
          </div>
        </div>

        <h2 className="home-title sedgwick-ave-display-regular">SecureKey</h2>

        <p className="about">
          <strong>SecureKey</strong> helps you manage your passwords with ease and security.
          Store, organize, and access all your login credentials in one place—securely
          encrypted and always available when you need them. Say goodbye to forgotten
          passwords and hello to peace of mind.
        </p>

        <div className="home-actions w-100">
          <button
            type="button"
            onClick={() => setNavigate(<Navigate to="/login" />)}
            className="btn sk-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
          >
            <span>Get started</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}