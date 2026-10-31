import Logo from "../assets/images/logo.svg";
import "./Loader.css";

const Loader = ({ visible, message = "Securing your passwords..." }) => {
  if (!visible) return null;

  return (
    <div className="loader-overlay" role="status" aria-live="polite">
      <div className="sk-loader-card">
        <div className="sk-loader-visual">
          <div className="sk-loader-glow" />
          <div className="sk-loader-orbit sk-loader-orbit-outer" />
          <div className="sk-loader-orbit sk-loader-orbit-inner" />
          <div className="sk-loader-core">
            <img src={Logo} alt="" width="28" height="28" className="sk-loader-logo" />
          </div>
        </div>
        <div className="sk-loader-text-group">
          <p className="sk-loader-title m-0">{message}</p>
          <div className="sk-loader-cipher" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;