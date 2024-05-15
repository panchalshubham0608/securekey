import React, { useContext } from "react";
import "../styles/Navbar.css";
import Logo from "../assets/logo.svg";
import { signOut } from "../utils/firebase";
import UserContext from "../context/UserContext";

export default function Navbar() {
  const userContext = useContext(UserContext);
  const handleSignOut = () => {
    signOut();
    userContext.setUser(null);
  };

  return (
    <div className="custom-navbar mb-3 d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center">
        <img src={Logo} alt="logo" />
        <h4 className="m-0 text-primary sedgwick-ave-display-regular">SecureKey</h4>
      </div>
      <div>
        <button className="btn text-primary merriweather-light"
          onClick={handleSignOut}>Logout</button>
      </div>
    </div>
  );
}