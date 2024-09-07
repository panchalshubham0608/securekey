import React, { useCallback, useState, useContext } from "react";
import "../styles/AuthForm.css";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Logo from "../assets/images/logo.svg";
import UserContext from "../context/UserContext";
import { createUserForContext } from "../utils/contextutil";
import { signIn, signUp } from "../utils/firebase";

export default function AuthForm(props) {
  const userContext = useContext(UserContext);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [credentialsError, setCredentialsError] = useState({
    email: null,
    password: null,
    confirmPassword: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [navigate, setNavigate] = useState(null);

  const validateFields = useCallback(() => {
    let valid = true;
    if (!credentials.email) {
      setCredentialsError(credentialsError => {
        return {
          ...credentialsError,
          email: "Email is required"
        }
      });
      valid = false;
    }
    if (!credentials.password) {
      setCredentialsError(credentialsError => {
        return {
          ...credentialsError,
          password: "Password is required"
        }
      });
      valid = false;
    }
    if (props.register && !credentials.confirmPassword) {
      setCredentialsError(credentialsError => {
        return {
          ...credentialsError,
          confirmPassword: "Confirm password is required"
        }
      });
      valid = false;
    }
    if (props.register && credentials.password !== credentials.confirmPassword) {
      setCredentialsError(credentialsError => {
        return {
          ...credentialsError,
          confirmPassword: "Passwords do not match"
        }
      });
      valid = false;
    }
    return valid;
  }, [credentials.email, credentials.password, credentials.confirmPassword, props.register]);

  const handleChange = (e) => {
    setCredentialsError(credentialsError => {
      return {
        ...credentialsError,
        [e.target.id]: ""
      }
    })
    setCredentials(credentials => {
      return {
        ...credentials,
        [e.target.id]: e.target.value
      };
    });
  }

  const onFocus = (e) => {
    setCredentialsError({
      ...credentialsError,
      [e.target.id]: ""
    });
  }

  const handleSubmit = (e) => {
    // prevent form submission
    e.preventDefault();
    e.stopPropagation();
    // if loading, return
    if (loading) {
      return;
    }
    // validate fields
    if (validateFields()) {
      setLoading(true);
      setError("");
      let method = props.register ? signUp : signIn;
      method({
        email: credentials.email,
        password: credentials.password
      }).then(() => {
        let userForContext = createUserForContext({
          username: credentials.email,
          password: credentials.password
        });
        userContext.setUser(userForContext);
        setNavigate(<Navigate to="/" />);
      }).catch((error) => {
        console.log(error);
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
      }).finally(() => {
        setLoading(false);
      });
    }
  }

  // if user is already logged in, navigate to home
  if (navigate) {
    return navigate;
  }

  let register = props.register;
  return (
    <div className="auth-form-container">
      {error && <div className="alert alert-danger w-100">{error}</div>}
      <form method="post" action="#" className="auth-form merriweather-light"
        onSubmit={handleSubmit}>
        <div className="d-flex align-items-center mb-3">
          <img className="mr-3" src={Logo} alt="logo" width="50" height="50" />
          <h4 className="m-0 text-primary sedgwick-ave-display-regular">SecureKey</h4>
        </div>
        <div className="mb-3 w-100">
          <label htmlFor="email" className="form-label">Email address</label>
          <input type="email" className="form-control" id="email"
            value={credentials.email} onChange={handleChange}
            onFocus={onFocus} />
          <div className="form-text text-danger">{credentialsError.email}</div>
        </div>
        <div className="mb-3 w-100">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="input-group">
            <input type={showPassword ? "text" : "password"} className="form-control" id="password"
              value={credentials.password} onChange={handleChange}
              onFocus={onFocus} />
            {
              // non-interactive elements with click handlers must have at least one keyboard event listener
              //eslint-disable-next-line
              <span className="input-group-text"
                onClick={() => setShowPassword(showPassword => !showPassword)}
              >{showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}</span>}
          </div>
          <div className="form-text text-danger">{credentialsError.password}</div>
        </div>
        {register && <div className="mb-3 w-100">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input type={showPassword ? "text" : "password"} className="form-control" id="confirmPassword"
            value={credentials.confirmPassword} onChange={handleChange}
            onFocus={onFocus} />
          <div className="form-text text-danger">{credentialsError.confirmPassword}</div>
        </div>}
        <div className="mb-3 w-100">
          <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
            disabled={loading}>
            {loading && <span className="spinner-border spinner-border mr-3"></span>}
            {register ? "Register" : "Login"}
          </button>
        </div>
        {register && <p>Already have an account? <Link to="/login">Login</Link></p>}
        {!register && <p>Don&apos;t have an account? <Link to="/register">Signup</Link></p>}
      </form>
    </div>
  )
}