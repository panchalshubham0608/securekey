import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import { useAppContext } from "../context/AppContext";
import "../styles/AuthForm.css";
import { secureSignIn } from "../utils/auth/secureSignIn";
import { secureSignUp } from "../utils/auth/secureSignUp";
import { evaluatePasswordStrength } from "../utils/passwordutil";

export default function AuthForm(props) {
  const { unlockVault } = useAppContext();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateFields = () => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (props.register && !confirmPassword) {
      setError("Confirm password is required");
      return false;
    }
    if (props.register && password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    // prevent form submission
    e.preventDefault();
    e.stopPropagation();
    if (!validateFields()) return;

    setError("");
    setLoading(true);
    try {
      const { mek, user: signedInUser } = props.register
        ? await secureSignUp({ email, password })
        : await secureSignIn({ email, password });
      unlockVault({ mek, user: signedInUser });
      navigate("/", { replace: true });
    } catch (error) {
      if (error.message) {
        if (error.message.includes("auth/email-already-in-use")) {
          setError("Email is already in use");
        } else if (error.message.includes("auth/invalid-credential")) {
          setError("Invalid email or password");
        } else if (error.message.includes("auth/weak-password")) {
          setError("Password is too weak");
        } else {
          setError(error.message);
        }
      } else {
        setError("An error occurred. Please try again later");
      }
    } finally {
      setLoading(false);
    }
  };

  const register = props.register;
  const strength = evaluatePasswordStrength(password);

  return (
    <div className="auth-form-container">
      {error && (
        <div className="auth-error-banner" role="alert">
          <i className="fa-solid fa-circle-exclamation" />
          <span>{error}</span>
        </div>
      )}

      <form
        method="post"
        action="#"
        className="auth-form merriweather-light"
        onSubmit={handleSubmit}
      >
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <img src={Logo} alt="logo" width="42" height="42" />
          </div>
          <div>
            <h4 className="m-0 sedgwick-ave-display-regular auth-brand-title">
              SecureKey
            </h4>
            <p className="auth-brand-subtitle m-0">
              {register
                ? "Create an account to secure your passwords"
                : "Sign in to access your saved passwords"}
            </p>
          </div>
        </div>

        <div className="mb-3 w-100">
          <label htmlFor="email" className="sk-input-label">
            Email address
          </label>
          <div className="auth-input-wrapper">
            <i className="fa-regular fa-envelope auth-input-icon" />
            <input
              type="email"
              className="form-control sk-input auth-input-with-icon"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3 w-100">
          <label htmlFor="password" className="sk-input-label">
            Master Password
          </label>
          <div className="auth-password-group">
            <i className="fa-solid fa-lock auth-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              className="form-control sk-input auth-input-with-both-icons"
              id="password"
              placeholder="Enter master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="auth-eye-btn"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <i className="fa-solid fa-eye-slash" />
              ) : (
                <i className="fa-solid fa-eye" />
              )}
            </button>
          </div>
          {register && password && (
            <div className="auth-strength-meter mt-2">
              <div className="auth-strength-bar-track">
                <div
                  className={`auth-strength-bar-fill strength-${strength.level}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
              <span className={`auth-strength-label strength-text-${strength.level}`}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {register && (
          <div className="mb-3 w-100">
            <label htmlFor="confirmPassword" className="sk-input-label">
              Confirm Password
            </label>
            <div className="auth-input-wrapper">
              <i className="fa-solid fa-shield-halved auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-control sk-input auth-input-with-icon"
                id="confirmPassword"
                placeholder="Re-enter master password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mt-2 mb-3 w-100">
          <button
            type="submit"
            className="btn sk-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading && <span className="spinner-border spinner-border-sm mr-3" />}
            <span>{register ? "Register" : "Login"}</span>
            {!loading && <i className="fa-solid fa-arrow-right" />}
          </button>
        </div>

        <div className="auth-switch-prompt">
          {register ? (
            <p className="m-0">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          ) : (
            <p className="m-0">
              Don&apos;t have an account? <Link to="/register">Signup</Link>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}