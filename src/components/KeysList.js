import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "../utils/debounce";
import KeyItem from "./KeyItem";
import "./KeysList.css";

export default function KeysList(props) {
  const { keys, readOnly, onDeleteKey } = props;

  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [filteredKeys, setFilteredKeys] = useState([...keys]);

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [openTrayIndex, setOpenTrayIndex] = useState(-1);

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

  /** ---------- EFFECT: Close expanded card or tray immediately on outside press ---------- **/
  useEffect(() => {
    const handlePointerDownOutside = (event) => {
      if (event.target.closest(".delete-confirm")) {
        return;
      }
      const wrapper = event.target.closest(".key-swipe-wrapper");
      if (!wrapper) {
        setSelectedIndex(-1);
        setOpenTrayIndex(-1);
        return;
      }
      const clickedIndex = Number(wrapper.getAttribute("data-key-index"));
      setSelectedIndex((prev) => (prev !== -1 && prev !== clickedIndex ? -1 : prev));
      setOpenTrayIndex((prev) => (prev !== -1 && prev !== clickedIndex ? -1 : prev));
    };

    document.addEventListener("pointerdown", handlePointerDownOutside, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDownOutside, true);
  }, []);

  // Don't act on form submission for search input
  const onSearchFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="keys-list-page">
      <div className="keys-list-container">
        {/* Search */}
        <form className="mb-3" action="#" method="post" onSubmit={onSearchFormSubmit}>
          <div className="search-input-container d-flex align-items-center">
            <i className="fa-solid fa-magnifying-glass search-icon" />
            <input
              type="text"
              className="form-control merriweather-light"
              placeholder="Search accounts or usernames..."
              aria-label="Search accounts or usernames"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                className="search-clear-btn"
                aria-label="Clear search"
                onClick={() => setSearchText("")}
              >
                <i className="fa-solid fa-times" />
              </button>
            )}
          </div>
        </form>

        {/* Header */}
        <div className="keys-list-header d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <p className="m-0 keys-count-label">
              Accounts ({filteredKeys.length})
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              className="btn sk-btn-primary keys-add-btn d-flex align-items-center gap-2"
              onClick={() => navigate("/add", { replace: true })}
            >
              <i className="fa-solid fa-plus" />
              <span>Add</span>
            </button>
          )}
        </div>

        {/* Keys List */}
        {filteredKeys.length > 0 ? (
          <div className="keys-items-stack">
            {filteredKeys.map((key, index) => (
              <KeyItem
                readOnly={readOnly}
                key={key.id || `${key.account}_${key.username}`}
                keyItem={key}
                selected={selectedIndex === index}
                trayOpen={openTrayIndex === index}
                onSetTrayOpen={(isOpen) => {
                  if (isOpen) {
                    setSelectedIndex(-1);
                    setOpenTrayIndex(index);
                  } else if (openTrayIndex === index) {
                    setOpenTrayIndex(-1);
                  }
                }}
                handleShowKeyBody={() => {
                  if (openTrayIndex === index) {
                    setOpenTrayIndex(-1);
                    return;
                  }
                  setOpenTrayIndex(-1);
                  setSelectedIndex((prev) => (prev === index ? -1 : index));
                }}
                handleHideKeyBody={() => setSelectedIndex(-1)}
                handleDeleteKey={onDeleteKey}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="keys-empty-state merriweather-light">
            <div className="keys-empty-icon">
              <i className="fa-solid fa-vault" />
            </div>
            <p className="m-0 keys-empty-title">No passwords found</p>
            <p className="m-0 keys-empty-subtitle">
              {searchText
                ? "Try searching with a different account or username."
                : "Your encrypted vault is empty. Add your first credential above."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

