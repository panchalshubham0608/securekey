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
        <div className="d-flex align-items-center mb-3">
          <img className="mr-3" src={Logo} alt="logo" width="50" height="50" />
          <h4 className="m-0 text-primary sedgwick-ave-display-regular">SecureKey</h4>
        </div>
        <div>
          <p className="about"><strong>SecureKey</strong> helps you manage your passwords with ease and security. Store, organize, and access all your login credentials in one place—securely encrypted and always available when you need them. Say goodbye to forgotten passwords and hello to peace of mind.</p>
          <button onClick={() => setNavigate(<Navigate to="/login" />)} className="btn btn-primary w-100 d-flex align-items-center justify-content-center">Get started</button>
        </div>
      </div>
    </div>
  )
}