import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import "../styles/KeysList.css";
import debounce from "../utils/debounce";
import History from "./History";
import KeyItem from "./KeyItem";
import Loader from "./Loader";
import Navbar from "./Navbar";

export default function KeysList(props) {
  const { } = useAppContext();
  const [keys, setKeys] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [openMenuIndex, setOpenMenuIndex] = useState(-1);
  const [historyKeyItem, setShowHistoryKeyItem] = useState(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [navigate, setNavigate] = useState(null);

  // register a click event listener to close the menu
  useEffect(() => {
    document.addEventListener("click", (event) => {
      // if the click is inside the key container, do nothing
      if (event.target.closest(".key-container")) {
        return;
      }
      setSelectedIndex(-1);
      setOpenMenuIndex(-1);
    });
  }, []);

  // function to fetch passkeys
  const fetchPassKeys = useCallback(() => {
    // setError("");
    // setLoading(true);
    // getPassKeys({ userContext })
    //   .then((keys) => {
    //     // sort keys
    //     keys.sort(
    //       (a, b) =>
    //         a.account.localeCompare(b.account) ||
    //         a.username.localeCompare(b.username)
    //     );
    //     setKeys(keys);
    //     setFilteredKeys(keys);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching keys", error);
    //     if (error.message) {
    //       setError(error.message);
    //     } else {
    //       setError("Error fetching keys");
    //     }
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
  }, []);

  // fetch passkeys when the component mounts
  useEffect(fetchPassKeys, [fetchPassKeys]);

  // debounced search
  // eslint-disable-next-line
  const debouncedSearch = useCallback(
    debounce((searchText) => {
      setFilteredKeys(
        keys.filter(
          (key) =>
            key.account.toLowerCase().includes(searchText.toLowerCase()) ||
            key.username.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }, 500),
    [keys]
  );

  useEffect(() => {
    // do a debounced search
    debouncedSearch(searchText);
  }, [searchText, debouncedSearch]);

  // function to show the key body
  const handleShowKeyBody = useCallback(
    (index) => {
      if (selectedIndex !== index) {
        setSelectedIndex(index);
      }
    },
    [selectedIndex]
  );

  // function to hide the key body
  const handleHideKeyBody = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  // function to toggle the menu
  const handleToggleMenu = useCallback((e, index) => {
    // don't show the key body when the menu is clicked
    e.preventDefault();
    e.stopPropagation();
    // toggle the menu
    setOpenMenuIndex(index);
  }, []);

  // function to edit a passkey
  const handleEditKey = useCallback(
    (key) => {
      props.setEditItem(key);
      setNavigate(<Navigate to={"/add-key"} />);
    },
    [props]
  );

  // function to delete a passkey
  const handleDeleteKey = useCallback(
    (key) => {
      // setError("");
      // setSuccess("");
      // setLoading(true);
      // deletePassKey({
      //   userContext,
      //   account: key.account,
      //   username: key.username,
      // })
      //   .then(() => {
      //     setSuccess("Passkey deleted successfully");
      //     fetchPassKeys();
      //   })
      //   .catch((error) => {
      //     console.error("Error deleting passkey", error);
      //     if (error.message) {
      //       setError(error.message);
      //     } else {
      //       setError("Error deleting passkey");
      //     }
      //   })
      //   .finally(() => {
      //     setLoading(false);
      //   });
    },
    [fetchPassKeys]
  );

  const handleShowHistory = useCallback((key) => {
    setShowHistoryKeyItem(key);
  }, []);

  // if navigate is set, return the Navigate component
  if (navigate) {
    return navigate;
  }

  return (
    <div>
      <div className="keys-list-container">
        <Navbar />
        {error && (
          <div className="alert alert-danger" data-testid="keys-list-error">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" data-testid="keys-list-success">
            {success}
          </div>
        )}
        <form method="post" action="#" className="mb-3">
          <div className="d-flex align-items-center justify-content-between search-input-container">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              className="form-control merriweather-light"
              placeholder="Search"
              data-testid="search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              name="searchText"
            />
            <button
              type="button"
              className="btn"
              style={{
                visibility: searchText ? "visible" : "hidden",
              }}
              onClick={() => setSearchText("")}
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
        </form>
        {loading ? (
          <Loader />
        ) : (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <p
                className="m-0 merriweather-light"
                data-testid="keys-list-count"
              >
                <strong>Accounts ({filteredKeys.length})</strong>
              </p>
              <button
                className="btn text-primary merriweather-light"
                onClick={() => setNavigate(<Navigate to={"/add-key"} />)}
              >
                <i className="fa-solid fa-plus"></i> Add
              </button>
            </div>
            {filteredKeys.map((key, index) => (
              <KeyItem
                key={`${key.account}_${key.username}`}
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
            ))}
            {filteredKeys.length === 0 && (
              <p
                className="text-center merriweather-light"
                data-testid="keys-list-no-keys"
              >
                No keys found
              </p>
            )}
          </div>
        )}
      </div>
      {historyKeyItem && <History keyItem={historyKeyItem} setShowHistoryKeyItem={setShowHistoryKeyItem} />}
    </div>
  );
}
