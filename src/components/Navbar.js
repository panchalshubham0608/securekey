import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import UserContext from "../context/UserContext";
import "../styles/Navbar.css";
import { signOut } from "../utils/firebase";

export default function Navbar() {
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const handleSignOut = () => {
    signOut();
    userContext.setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="custom-navbar mb-3 d-flex align-items-center justify-content-between" data-testid="navbar">
      <div className="d-flex align-items-center">
        <img src={Logo} alt="logo" />
        <h4 className="m-0 text-primary sedgwick-ave-display-regular">SecureKey</h4>
      </div>
      <div>
        <button className="btn text-primary merriweather-light" data-testid="logout-button"
          onClick={handleSignOut}>Logout</button>
      </div>
    </div>
  );
}