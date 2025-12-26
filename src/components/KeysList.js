import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "../utils/debounce";
import Alert from "./Alert";
import KeyItem from "./KeyItem";
import "./KeysList.css";

export default function KeysList(props) {
  const { keys, readOnly, onDeleteKey } = props;

  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [filteredKeys, setFilteredKeys] = useState([...keys]);

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [openMenuIndex, setOpenMenuIndex] = useState(-1);

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

  const handleToggleMenu = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuIndex((prev) => (prev === index ? -1 : index));
  }, []);

  // Don't act on form submission for search input
  const onSearchFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="keys-list-page">
      <Alert alert={alert} />
      <div className="keys-list-container">
        {/* Search */}
        <form className="mb-3" action="#" method="post" onSubmit={onSearchFormSubmit}>
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
          {!readOnly && <button
            className="btn text-primary"
            onClick={() => navigate("/add", { replace: true })}
          >
            <i className="fa-solid fa-plus" /> Add
          </button>}
        </div>

        {/* Keys List */}
        {filteredKeys.length > 0 ? (
          filteredKeys.map((key, index) => (
            <KeyItem
              readOnly={readOnly}
              key={key.id || `${key.account}_${key.username}`}
              keyItem={key}
              selected={selectedIndex === index}
              handleShowKeyBody={() => setSelectedIndex(index)}
              handleHideKeyBody={() => setSelectedIndex(-1)}
              showMenu={openMenuIndex === index}
              handleToggleMenu={handleToggleMenu}
              handleDeleteKey={onDeleteKey}
              index={index}
            />
          ))
        ) : (
          <p className="text-center merriweather-light">No passwords found</p>
        )}
      </div>
    </div>
  );
}
