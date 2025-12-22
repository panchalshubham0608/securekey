import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAlert } from "../hooks/useAlert";
import "../styles/KeysList.css";
import debounce from "../utils/debounce";
import { deleteVaultItem, listVaultItems } from "../utils/vault/vaultService";
import Alert from "./Alert";
import History from "./History";
import KeyItem from "./KeyItem";
import Loader from "./Loader";

export default function KeysList({ setEditItem }) {
  const { user } = useAppContext();
  const { alert, showAlert } = useAlert();

  const [keys, setKeys] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [openMenuIndex, setOpenMenuIndex] = useState(-1);
  const [historyKeyItem, setShowHistoryKeyItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [navigate, setNavigate] = useState(null);

  /** ---------- EFFECT: Close menu on outside click ---------- **/
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".key-container")) {
        setSelectedIndex(-1);
        setOpenMenuIndex(-1);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /** ---------- Fetch Vault Items ---------- **/
  const fetchVaultItems = useCallback(async () => {
    setLoading(true);
    try {
      const vaultKeys = await listVaultItems({ uid: user.uid });
      vaultKeys.sort(
        (a, b) =>
          a.account.localeCompare(b.account) ||
          a.username.localeCompare(b.username)
      );
      setKeys(vaultKeys);
      setFilteredKeys(vaultKeys);
    } catch (error) {
      console.error("Error fetching keys", error);
      showAlert(error.message || "Error fetching keys", "error");
    } finally {
      setLoading(false);
    }
  }, [user.uid, showAlert]);

  useEffect(() => {
    fetchVaultItems();
  }, [fetchVaultItems]);

  /** ---------- Debounced search ---------- **/
  useEffect(() => {
    const debounced = debounce((text) => {
      const filtered = keys.filter(
        (key) =>
          key.account.toLowerCase().includes(text.toLowerCase()) ||
          key.username.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredKeys(filtered);
    }, 500);

    debounced(searchText);
  }, [searchText, keys]);

  /** ---------- Handlers ---------- **/
  const handleShowKeyBody = useCallback(
    (index) => setSelectedIndex(index),
    []
  );

  const handleHideKeyBody = useCallback(() => setSelectedIndex(-1), []);

  const handleToggleMenu = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuIndex((prev) => (prev === index ? -1 : index));
  }, []);

  const handleEditKey = useCallback(
    (key) => {
      setEditItem?.(key);
      setNavigate(<Navigate to={`/edit/${key.id}`} replace />);
    },
    [setEditItem]
  );

  const handleDeleteKey = useCallback(
    async (key) => {
      setLoading(true);
      try {
        await deleteVaultItem({ uid: user.uid, itemId: key.id });
        showAlert("Entry deleted successfully", "success");
        fetchVaultItems();
      } catch (error) {
        console.error("Error deleting passkey", error);
        showAlert(error.message || "Error deleting passkey", "error");
      } finally {
        setLoading(false);
      }
    },
    [user.uid, showAlert, fetchVaultItems]
  );

  const handleShowHistory = useCallback((key) => {
    setShowHistoryKeyItem(key);
  }, []);

  /** ---------- JSX ---------- **/
  if (navigate) return navigate;

  return (
    <div className="keys-list-page">
      <Alert alert={alert} />
      <Loader visible={loading} />

      <div className="keys-list-container">
        {/* Search */}
        <form className="mb-3">
          <div className="search-input-container d-flex align-items-center">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              className="form-control merriweather-light"
              placeholder="Search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                className="btn"
                onClick={() => setSearchText("")}
              >
                <i className="fa-solid fa-times" />
              </button>
            )}
          </div>
        </form>

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p className="m-0">Accounts ({filteredKeys.length})</p>
          <button
            className="btn text-primary"
            onClick={() => setNavigate(<Navigate to="/add" replace />)}
          >
            <i className="fa-solid fa-plus" /> Add
          </button>
        </div>

        {/* Keys List */}
        {filteredKeys.length > 0 ? (
          filteredKeys.map((key, index) => (
            <KeyItem
              key={key.id || `${key.account}_${key.username}`}
              keyItem={key}
              selected={selectedIndex === index}
              handleShowKeyBody={handleShowKeyBody}
              handleHideKeyBody={handleHideKeyBody}
              showMenu={openMenuIndex === index}
              handleToggleMenu={handleToggleMenu}
              handleEditKey={handleEditKey}
              handleDeleteKey={handleDeleteKey}
              handleShowHistory={handleShowHistory}
              index={index}
            />
          ))
        ) : (
          <p className="text-center merriweather-light">No keys found</p>
        )}
      </div>

      {/* History Modal */}
      {historyKeyItem && (
        <History
          keyItem={historyKeyItem}
          setShowHistoryKeyItem={setShowHistoryKeyItem}
        />
      )}
    </div>
  );
}
