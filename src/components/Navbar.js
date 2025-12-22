import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import { useAppContext } from "../context/AppContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { logout } = useAppContext();

  const handleSignout = async () => {
    await logout();
    navigate("/welcome", { replace: true });
  }

  return (
    <div className="custom-navbar mb-3 d-flex align-items-center justify-content-between" data-testid="navbar">
      <div className="d-flex align-items-center">
        <img src={Logo} alt="logo" />
        <h4 className="m-0 text-primary sedgwick-ave-display-regular">SecureKey</h4>
      </div>
      <div>
        <button className="btn text-primary merriweather-light" data-testid="logout-button"
          onClick={handleSignout}>Logout</button>
      </div>
    </div>
  );
}