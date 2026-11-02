import { useState } from "react";
import { Navigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import "../styles/Home.css";

const FEATURES = [
  {
    icon: "fa-solid fa-shield-halved",
    tone: "indigo",
    title: "Private by design",
    description: "Your credentials are encrypted before they ever leave your device.",
  },
  {
    icon: "fa-solid fa-fingerprint",
    tone: "cyan",
    title: "Quick biometric unlock",
    description: "Unlock in seconds using passkeys or device biometrics.",
  },
  {
    icon: "fa-solid fa-bolt",
    tone: "emerald",
    title: "One-tap copy & history",
    description: "Copy passwords instantly and view past changes whenever you need.",
  },
];

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
        <p className="home-subtitle">
          All your passwords in one safe place—simple, private, and always within reach.
        </p>

        <div className="home-features w-100">
          {FEATURES.map((feature) => (
            <div className="home-feature-row" key={feature.title}>
              <div className={`home-feature-icon tone-${feature.tone}`}>
                <i className={feature.icon} />
              </div>
              <div className="home-feature-text">
                <h6 className="home-feature-title m-0">{feature.title}</h6>
                <p className="home-feature-desc m-0">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

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