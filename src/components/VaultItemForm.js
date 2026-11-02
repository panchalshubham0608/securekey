import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAlert } from "../hooks/useAlert";
import AccountIconsList from "../utils/AccountIconsList";
import { evaluatePasswordStrength, generateStrongPassword } from "../utils/passwordutil";
import {
  addVaultItem,
  getVaultItemById,
  updateVaultItem
} from "../utils/vault/vaultService";
import AccountIcon from "./AccountIcon";
import Alert from "./Alert";
import Loader from "./Loader";
import "./VaultItemForm.css";

const ALL_ACCOUNTS = Object.keys(AccountIconsList);
const PASSWORD_LENGTHS = [8, 10, 12, 16, 24];

export default function VaultItemForm() {
  const { itemId } = useParams();
  const editing = Boolean(itemId);

  const { user, mek } = useAppContext();
  const { alert, showAlert } = useAlert();

  const [account, setAccount] = useState("");
  const [customAccount, setCustomAccount] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [genLength, setGenLength] = useState(16);
  const [loading, setLoading] = useState(false);
  const [navigate, setNavigate] = useState(null);

  const [accountSearch, setAccountSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  /* ------------------ Fetch item for edit ------------------ */
  useEffect(() => {
    if (!editing) return;

    const fetchItem = async () => {
      setLoading(true);
      try {
        const item = await getVaultItemById({
          uid: user.uid,
          itemId
        });
        setAccount(item.account);
        setUsername(item.username);
      } catch (err) {
        showAlert(err.message || "Error fetching vault item", "error");
        setNavigate(<Navigate to="/" replace />);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [editing, itemId, user.uid, showAlert]);

  /* ------------------ Derived filtered accounts ------------------ */
  const filteredAccounts = useMemo(() => {
    return ALL_ACCOUNTS.filter((a) =>
      a.toLowerCase().includes(accountSearch.toLowerCase())
    );
  }, [accountSearch]);

  const effectiveAccount =
    account === "Other" ? customAccount.trim() || "Other" : account;

  /* ------------------ Handlers ------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!effectiveAccount || !username || !password) {
      showAlert("All fields are required", "error");
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        await updateVaultItem({
          uid: user.uid,
          itemId,
          mek,
          newPassword: password
        });
      } else {
        await addVaultItem({
          uid: user.uid,
          mek,
          account: effectiveAccount,
          username,
          password
        });
      }
      setNavigate(<Navigate to="/" replace />);
    } catch (err) {
      showAlert(err.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = useCallback((value) => {
    setAccount(value);
    setAccountSearch("");
    setShowDropdown(false);
  }, []);

  const handleGeneratePassword = (lengthOverride) => {
    const targetLength = typeof lengthOverride === "number" ? lengthOverride : genLength;
    const generated = generateStrongPassword(targetLength);
    setPassword(generated);
  };

  if (navigate) return navigate;

  const strength = evaluatePasswordStrength(password);

  return (
    <div className="modal-overlay">
      <Alert alert={alert} />
      <Loader
        visible={loading}
        message={editing ? "Updating your password..." : "Saving your password..."}
      />
      <div className="modal-content vault-form-modal">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between add-vaultItem-navbar">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="sk-icon-btn"
              aria-label="Back to dashboard"
              onClick={() => setNavigate(<Navigate to="/" />)}
            >
              <i className="fa-solid fa-arrow-left" />
            </button>
            <div>
              <h4 className="m-0 vault-form-title">
                {editing ? "Edit" : "Add"} Item
              </h4>
              <p className="m-0 vault-form-subtitle">
                {editing
                  ? "Update your saved account password"
                  : "Save a new login credential"}
              </p>
            </div>
          </div>
          {effectiveAccount && (
            <div className="vault-form-selected-icon">
              <AccountIcon account={effectiveAccount} username={username} />
            </div>
          )}
        </div>

        <div className="add-vaultItem-container">
          <form className="vault-item-form" onSubmit={handleSubmit}>
            {/* Account with searchable dropdown */}
            <div className="mb-3 position-relative">
              <label className="sk-input-label" htmlFor="accountInput">
                Account Provider
              </label>
              <div className="vault-input-wrap">
                <i className="fa-solid fa-building-shield vault-input-icon" />
                <input
                  type="text"
                  id="accountInput"
                  className="form-control sk-input vault-input-padded"
                  value={editing ? account : accountSearch || account}
                  disabled={editing}
                  placeholder="Search or enter provider (e.g. GitHub, Netflix)"
                  onFocus={() => !editing && setShowDropdown(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAccountSearch(val);
                    setAccount(val);
                  }}
                />
              </div>

              {!editing && showDropdown && (
                <div className="dropdown-menu show dropdown-scrollable w-100 mt-1">
                  {filteredAccounts.map((acc) => (
                    <button
                      type="button"
                      key={acc}
                      className="dropdown-item d-flex align-items-center gap-2"
                      onClick={() => handleSelectAccount(acc)}
                    >
                      <div className="dropdown-account-icon">
                        <AccountIcon account={acc} username={username} />
                      </div>
                      <span>{acc}</span>
                    </button>
                  ))}
                  {accountSearch.trim() &&
                    !ALL_ACCOUNTS.some(
                      (a) => a.toLowerCase() === accountSearch.trim().toLowerCase()
                    ) && (
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center gap-2"
                      onClick={() => handleSelectAccount(accountSearch.trim())}
                    >
                      <div className="dropdown-account-icon">
                        <AccountIcon account={accountSearch.trim()} username={username} />
                      </div>
                      <span>Use &ldquo;{accountSearch.trim()}&rdquo;</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {!editing && account === "Other" && (
              <div className="mb-3">
                <label className="sk-input-label" htmlFor="customAccountInput">
                  Provider Name (Optional)
                </label>
                <div className="vault-input-wrap">
                  <i className="fa-solid fa-tag vault-input-icon" />
                  <input
                    id="customAccountInput"
                    type="text"
                    className="form-control sk-input vault-input-padded"
                    placeholder="e.g. Netflix, Spotify, Slack"
                    value={customAccount}
                    onChange={(e) => setCustomAccount(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Username */}
            <div className="mb-3">
              <label className="sk-input-label" htmlFor="usernameInput">
                Username / Email
              </label>
              <div className="vault-input-wrap">
                <i className="fa-regular fa-user vault-input-icon" />
                <input
                  id="usernameInput"
                  type="text"
                  className="form-control sk-input vault-input-padded"
                  placeholder="Enter username or email"
                  value={username}
                  disabled={editing}
                  onChange={(e) => !editing && setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="sk-input-label m-0" htmlFor="passwordInput">
                  Password
                </label>
                <span className={`vault-strength-badge strength-text-${strength.level}`}>
                  {strength.label}
                </span>
              </div>

              <div className="vault-input-wrap">
                <i className="fa-solid fa-key vault-input-icon" />
                <input
                  id="passwordInput"
                  type={showPassword ? "text" : "password"}
                  className="form-control sk-input vault-input-both-padded font-mono"
                  placeholder="Enter or generate a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="vault-eye-btn"
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

              {/* Password Strength Meter */}
              <div className="vault-strength-track mt-2">
                <div
                  className={`vault-strength-fill strength-${strength.level}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>

              {/* Built-in Next-Gen Password Generator Toolbar */}
              <div className="password-generator-bar mt-2">
                <div className="d-flex align-items-center gap-1">
                  <span className="gen-length-label">Length:</span>
                  {PASSWORD_LENGTHS.map((len) => (
                    <button
                      type="button"
                      key={len}
                      className={`gen-length-pill ${genLength === len ? "active" : ""}`}
                      onClick={() => {
                        setGenLength(len);
                        handleGeneratePassword(len);
                      }}
                    >
                      {len}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="gen-trigger-btn"
                  onClick={() => handleGeneratePassword()}
                >
                  <i className="fa-solid fa-wand-magic-sparkles" />
                  <span>Generate</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn sk-btn-primary w-100 mt-1 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              <i className={`fa-solid ${editing ? "fa-check" : "fa-plus"}`} />
              <span>
                {loading
                  ? editing
                    ? "Updating..."
                    : "Adding..."
                  : editing
                    ? "Update"
                    : "Add"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

