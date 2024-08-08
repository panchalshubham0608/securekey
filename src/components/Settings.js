import React, { useContext, useState } from "react";
import "../styles/Settings.css";
import {
  isMultiFactorEnrollmentEnabled,
  request2FACodeWithPhoneNumber,
  setUpRecaptchaVerifier,
} from "../utils/firebase";
import UserContext from "../context/UserContext";

export default function Settings() {
  const [showSettings, setShowSettings] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const userContext = useContext(UserContext);
  const mfaEnabled = isMultiFactorEnrollmentEnabled(userContext.credentials);
  const [error, setError] = useState("");

  const handleSendOtp = () => {
    setError("");
    if (!phoneNumber) return;
    setUpRecaptchaVerifier()
      .then(() => {
        request2FACodeWithPhoneNumber({
          user: userContext.credentials,
          phoneNumber,
          appVerifier: window.recaptchaVerifier,
        })
          .then((verificationId) => {
            console.log(verificationId);
            setOtpSent(true);
          })
          .catch((err) => {
            console.log(err);
            setError("Failed to send otp.");
          });
      })
      .catch((err) => {
        console.log(err);
        setError("Failed to set reCAPTCHA");
      });
  };

  return (
    <div>
      {showSettings && (
        <div className="settings-page">
          <div id="recaptcha-container"></div>
          <div>
            <h3 className="merriweather-light">Settings</h3>
            <hr />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="border p-3 rounded">
            {mfaEnabled ? (
              <div>
                <p className="mb-0">
                  Add an extra layer of security to your account with SMS
                  multi-factor authentication.
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-0">
                  Add an extra layer of security to your account with SMS
                  multi-factor authentication.
                </p>
                <hr />
                <form className="mfa-form">
                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="phoneNumber"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    {otpSent ? (
                      <button type="submit" className="btn btn-primary w-100">
                        Register
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleSendOtp}
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="settings-icon d-flex justify-content-end">
        <button
          className="btn bg-primary border rounded-circle text-light d-flex align-items-center justify-content-center"
          onClick={() => setShowSettings((showSettings) => !showSettings)}
        >
          {showSettings ? (
            <i className="fa fa-times" />
          ) : (
            <i className="fa fa-gear" />
          )}
        </button>
      </div>
    </div>
  );
}
