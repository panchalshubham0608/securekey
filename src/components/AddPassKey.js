import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAlert } from "../hooks/useAlert";
import "../styles/AddPassKey.css";
import AccountIconsList from "../utils/AccountIconsList";
import {
  addVaultItem,
  getVaultItemById,
  updateVaultItem
} from "../utils/vault/vaultService";
import AccountIcon from "./AccountIcon";
import Alert from "./Alert";
import Loader from "./Loader";

const ALL_ACCOUNTS = Object.keys(AccountIconsList);

export default function AddPassKey() {
  const { itemId } = useParams();
  const editing = Boolean(itemId);

  const { user, mek } = useAppContext();
  const { alert, showAlert } = useAlert();

  const [account, setAccount] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        console.log(err);
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
    return ALL_ACCOUNTS.filter(a =>
      a.toLowerCase().includes(accountSearch.toLowerCase())
    );
  }, [accountSearch]);

  /* ------------------ Handlers ------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!account || !username || !password) {
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
          account,
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

  if (navigate) return navigate;

  return (
    <div>
      <Alert alert={alert} />
      <Loader visible={loading} />

      {/* Header */}
      <div className="d-flex align-items-center add-passkey-navbar mb-1">
        <button className="btn" onClick={() => setNavigate(<Navigate to="/" />)}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h4 className="m-0">
          {editing ? "Edit" : "Add"} Passkey
        </h4>
      </div>

      <div className="add-passkey-container">
        <form className="border p-3 mb-3" onSubmit={handleSubmit}>

          {/* Account with searchable dropdown */}
          <div className="mb-2 position-relative">
            <label className="form-label" htmlFor="accountInput">Account</label>
            <input
              type="text"
              id="accountInput"
              className="form-control"
              value={editing ? account : accountSearch || account}
              disabled={editing}
              placeholder="Search account"
              onFocus={() => !editing && setShowDropdown(true)}
              onChange={(e) => {
                setAccountSearch(e.target.value);
                setAccount("");
              }}
            />

            {!editing && showDropdown && (
              <div className="dropdown-menu show dropdown-scrollable w-100 mt-1">
                {filteredAccounts.length === 0 && (
                  <div className="dropdown-item text-muted">
                    No results
                  </div>
                )}
                {filteredAccounts.map(acc => (
                  <button
                    type="button"
                    key={acc}
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => handleSelectAccount(acc)}
                  >
                    <AccountIcon account={acc} />
                    <span className="ms-2">{acc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Username */}
          <div className="mb-2">
            <label className="form-label" htmlFor="usernameInput">Username</label>
            <input
              id="usernameInput"
              type="text"
              className="form-control"
              value={username}
              disabled={editing}
              onChange={e => !editing && setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="form-label" htmlFor="passwordInput">Password</label>
            <input
              id="passwordInput"
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading
              ? editing ? "Updating..." : "Adding..."
              : editing ? "Update" : "Add"}
          </button>
        </form>
      </div>
    </div>
  );
}
