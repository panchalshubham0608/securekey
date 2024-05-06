import React, { useCallback, useState, useEffect } from "react";
import "../styles/KeysList.css";
import sha256 from "crypto-js/sha256";
import debounce from "../utils/debounce";
import { getPassKeyValue, getPassKeys, deletePassKey } from "../utils/firestore";
import Navbar from "./Navbar";
import AccountIcon from "./AccountIcon";
import { Navigate } from "react-router-dom";

export default function KeysList(props) {
    const [keys, setKeys] = useState([]);
    const [filteredKeys, setFilteredKeys] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [lastIntervalId, setLastIntervalId] = useState(null);
    const [timer, setTimer] = useState(30);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [loadingPassKeys, setLoadingPassKeys] = useState(false);
    const [passKeyError, setPassKeyError] = useState("");
    const [error, setError] = useState("");
    const [copyIconClassName, setCopyIconClassName] = useState("fa-regular fa-copy");
    const [openMenuIndex, setOpenMenuIndex] = useState(-1);
    const [deleteIndex, setDeleteIndex] = useState(-1);
    const [navigate, setNavigate] = useState(null);

    const fetchPassKeys = useCallback(() => {
        setPassKeyError("");
        setLoadingPassKeys(true);
        getPassKeys()
            .then((keys) => {
                setKeys(keys);
                setFilteredKeys(keys);
            }).catch((error) => {
                console.error("Error fetching keys", error);
                if (error.message) {
                    setPassKeyError(error.message);
                } else {
                    setPassKeyError("Error fetching keys");
                }
            }).finally(() => {
                setLoadingPassKeys(false);
            });
    }, []);

    useEffect(() => {
        fetchPassKeys();
    }, [fetchPassKeys]);

    useEffect(() => {
        document.addEventListener("click", (event) => {
            // if the click is inside the key container, do nothing
            if (event.target.closest(".key-container")) {
                return;
            }
            if (selectedIndex !== -1) {
                setSelectedIndex(-1);
                if (lastIntervalId) {
                    clearInterval(lastIntervalId);
                }
                setTimer(30);
            }
            if (openMenuIndex !== -1) {
                setOpenMenuIndex(-1);
            }
        });
    }, [lastIntervalId, selectedIndex, openMenuIndex]);

    const debouncedSearch = debounce((searchText) => {
        setFilteredKeys(keys.filter(key => key.account.toLowerCase().includes(searchText.toLowerCase()) ||
            key.username.toLowerCase().includes(searchText.toLowerCase())));
    }, 500);

    useEffect(() => {
        // if keys are loading, do nothing
        if (loadingPassKeys) {
            return;
        }
        debouncedSearch(searchText);
    }, [searchText, debouncedSearch, loadingPassKeys]);

    const handleChangeSearchText = useCallback((e) => {
        setSearchText(e.target.value);
    }, [setSearchText]);

    const handleClearInput = useCallback(() => {
        setSearchText("");
    }, [setSearchText]);

    const handleToggleMenu = useCallback((e, index) => {
        // don't show the key body when the menu is clicked
        e.preventDefault();
        e.stopPropagation();
        // toggle the menu
        setOpenMenuIndex(index);
    }, [setOpenMenuIndex]);

    const handleEditPassKey = useCallback((index) => {
        const key = filteredKeys[index];
        props.setEditItem(key);
        setNavigate(<Navigate to={"/add-key"} />);
    }, [filteredKeys, props]);

    const handleDeletePassKey = useCallback((index) => {
        setLoadingPassKeys(true);
        setDeleteIndex(-1);
        deletePassKey({ account: filteredKeys[index].account, username: filteredKeys[index].username })
            .then(() => {
                fetchPassKeys();
            }).catch((error) => {
                console.error("Error deleting passkey", error);
                if (error.message) {
                    setPassKeyError(error.message);
                } else {
                    setPassKeyError("Error deleting passkey");
                }
            })
            .finally(() => {
                setLoadingPassKeys(false);
            });
    }, [fetchPassKeys, filteredKeys]);

    const handleAction = useCallback((event, index, action) => {
        // stop the event from propagating to the parent div
        event.preventDefault();
        event.stopPropagation();
        // close the menu
        setOpenMenuIndex(-1);
        // perform the action
        if (action === "edit") {
            handleEditPassKey(index);
        } else if (action === "delete") {
            setDeleteIndex(index);
        }
    }, [handleEditPassKey, setDeleteIndex, setOpenMenuIndex]);

    const handleCopyPassword = useCallback(() => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(password);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = password;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
            } catch (err) {
                console.error("Failed to copy password to clipboard", err);
            }
            textArea.remove();
        }
        setCopyIconClassName("fa-solid fa-check");
        setTimeout(() => {
            setCopyIconClassName("fa-regular fa-copy");
        }, 1000);
    }, [password]);

    const handleShowKeyBody = useCallback((index) => {
        // if the same key is clicked again, do nothing
        // if a key is already loading, do nothing
        if (selectedIndex === index || loading) {
            return;
        }
        if (lastIntervalId) {
            clearInterval(lastIntervalId);
        }
        setSelectedIndex(index);
        setLoading(true);
        setError("");

        // fetch password
        getPassKeyValue({
            account: filteredKeys[index].account,
            username: filteredKeys[index].username
        }).then((pass) => {
            setPassword(pass);
            console.log(pass);
            // if password is fetched, start the timer
            setTimer(30);
            setLastIntervalId(setInterval(() => {
                setTimer(prevTimer => {
                    if (prevTimer === 1) {
                        setSelectedIndex(-1);
                        if (lastIntervalId) {
                            clearInterval(lastIntervalId);
                        }
                        return 30;
                    }
                    return prevTimer - 1;
                });
            }, 1000));
        }).catch((error) => {
            if (error.message) {
                setError(error.message);
            } else {
                setError("Error: Could not get password");
            }
        }).finally(() => {
            setLoading(false);
        });
    }, [lastIntervalId, setSelectedIndex, filteredKeys, loading, selectedIndex]);

    const stringToColor = useCallback((string) => {
        // Hash the input string
        let hash = sha256(string);
        // Extract the last 6 characters of the hash
        let hex = hash.toString().slice(-6);
        return `#${hex}`;
    }, []);

    // if navigate is set, return the Navigate component
    if (navigate) {
        return navigate;
    }

    return (
        <div>            
            <div className="keys-list-container">
                <Navbar />
                {passKeyError && <div className="alert alert-danger">{passKeyError}</div>}
                <form method="post" action="#" className="mb-3">
                    <div className="d-flex align-items-center justify-content-between search-input-container">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input type="text" className="form-control merriweather-light" placeholder="Search"
                            value={searchText} onChange={handleChangeSearchText} name="searchText" />
                        <button type="button" className="btn" style={{
                            visibility: searchText ? "visible" : "hidden"
                        }} onClick={handleClearInput}>
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                </form>
                {loadingPassKeys ? 
                <div className="d-flex justify-content-center mb-3">
                    <div className="spinner-border" style={{
                        borderColor: "#0d6efd",
                        borderRightColor: "transparent"
                    }} role="status"></div>
                </div> :
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <p className="m-0 merriweather-light"><strong>Accounts ({filteredKeys.length})</strong></p>
                        <button className="btn text-primary merriweather-light"
                            onClick={() => setNavigate(<Navigate to={"/add-key"} />)}><i className="fa-solid fa-plus"></i> Add</button>
                    </div>
                    {filteredKeys.map((key, index) => (
                        <div className="key-container mb-3 merriweather-light" key={`${key.account}_${key.username}`}
                            style={{ borderTop: `5px solid ${stringToColor(key.account)}` }}
                            onClick={e => handleShowKeyBody(index)}>
                            <div className="mb-3 d-flex align-items-start justify-content-between">
                                <div className="d-flex align-items-center">
                                    <AccountIcon account={key.account} />
                                    <div>
                                        <p className="key-account m-0">{key.account}</p>
                                        <p className="key-username m-0">{key.username}</p>
                                    </div>
                                </div>
                                <div className="key-action">
                                    <button className="btn merriweather-light"
                                        onClick={e => handleToggleMenu(e, index)}>
                                        <i className="fa-solid fa-ellipsis"></i>
                                    </button>
                                    {index === openMenuIndex && <ul>
                                        <li onClick={e => handleAction(e, index, "edit")}>Edit</li>
                                        <li onClick={e => handleAction(e, index, "delete")}>Delete</li>
                                    </ul>}
                                </div>
                            </div>
                            {index === selectedIndex &&
                                <div className="key-body">
                                    {loading ?
                                        <div className="d-flex justify-content-center mt-3">
                                            <div className="spinner-border" role="status" style={{
                                                borderColor: stringToColor(key.account),
                                                borderRightColor: "transparent"
                                            }}>
                                            </div>
                                        </div> :
                                        <div>
                                            {error ?
                                                <p className="text-danger text-center m-0">{error}</p> :
                                                <div>
                                                    <div className="d-flex justify-content-center">
                                                        <div className="shrinking-div"></div>
                                                    </div>
                                                    <div className="d-flex align-items-center justify-content-center mt-3">
                                                        <p className="m-0 passkey">{password}</p>
                                                        <button className="btn merriweather-light text-primary"
                                                            onClick={handleCopyPassword}><i className={copyIconClassName}></i> Copy</button>
                                                    </div>
                                                    <p className="text-center m-0"><strong>{timer}s</strong> until hide</p>
                                                </div>}
                                        </div>}
                                </div>}
                        </div>
                    ))}
                    {filteredKeys.length === 0 && <p className="text-center merriweather-light">No keys found</p>}
                </div>}
                {deleteIndex !== -1 && <div className="delete-confirm-container">
                    <div className="delete-confirm">
                        <p className="m-0 merriweather-light">Are you sure you want to <strong>delete</strong> this key?</p>
                        <div>
                            <p className="m-0 merriweather-light"><strong>Account:</strong> {filteredKeys[deleteIndex].account}</p>
                            <p className="m-0 merriweather-light"><strong>Username:</strong> {filteredKeys[deleteIndex].username}</p>
                        </div>
                        <div className="d-flex justify-content-between mt-3">
                            <button className="btn btn-danger merriweather-light mr-3"
                                onClick={e => handleDeletePassKey(deleteIndex)}>Delete</button>
                            <button className="btn btn-secondary merriweather-light"
                                onClick={e => setDeleteIndex(-1)}>Cancel</button>
                        </div>
                    </div>
                </div>}
            </div>
        </div>
    );
}
