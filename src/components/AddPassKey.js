import React, { useState, useCallback, useEffect } from "react";
import '../styles/AddPassKey.css';
import AccountIconsList from "../utils/AccountIconsList";
import AccountIcon from "./AccountIcon";
import { upsertPassKey } from "../utils/firestore";
import { Navigate } from "react-router-dom";

export default function AddPassKey(props) {
    const { setEditItem } = props;
    const [searchText, setSearchText] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState(Object.keys(AccountIconsList));
    const [account, setAccount] = useState(props.editItem?.account || "");
    const [username, setUsername] = useState(props.editItem?.username || "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [navigate, setNavigate] = useState(null);

    const debouncedSearch = useCallback((searchText) => {
        let accounts = Object.keys(AccountIconsList);
        setFilteredAccounts(
            accounts.filter(account => account.toLowerCase().includes(searchText.toLowerCase()))
        );
    }, [setFilteredAccounts]);

    useEffect(() => {
        debouncedSearch(searchText);
    }, [searchText, debouncedSearch]);

    const handleChangeSearchText = useCallback((e) => {
        setSearchText(e.target.value);
    }, [setSearchText]);

    const handleClearInput = useCallback(() => {
        setSearchText("");
    }, [setSearchText]);

    const handleSelectAccount = useCallback((account) => {
        if (!props.editItem) {
            setAccount(account);
        }
    }, [props.editItem]);

    const handleAddPassKey = useCallback((e) => {
        // prevent form submission
        e.preventDefault();
        e.stopPropagation();

        // clear error and success messages
        setError("");

        // validate account, username and password
        if (!account) {
            setError("Account is required");
            return;
        }
        if (!username) {
            setError("Username is required");
            return;
        }
        if (!password) {
            setError("Password is required");
            return;
        }

        // make request
        setLoading(true);
        let editing = !!props.editItem;
        upsertPassKey({ account, username, password })
            .then(() => {
                setSuccess(`Passkey ${editing ? "updated" : "added"} successfully`);
                if (editing) {
                    props.setEditItem(null);    
                    setNavigate(<Navigate to="/" />);                
                }
                setAccount("");
                setUsername("");
                setPassword("");
            }).catch((error) => {
                console.error("Error adding passkey", error);
                if (error.message) {
                    setError(error.message);
                } else {
                    setError(`Error ${editing ? "updating" : "adding"} passkey`);
                }
            }).finally(() => {
                setLoading(false);
            });
    }, [account, username, password, setError, props]);

    // if we have a navigate element, return it
    if (navigate) {
        return navigate;
    }

    // check if we are editing an item
    let editing = !!props.editItem;

    return (
        <div>
            <div className="d-flex align-items-center add-passkey-navbar mb-1">
                <button type="button" className="btn" onClick={() => {
                    setEditItem(null);
                    setNavigate(<Navigate to="/" />);
                }}>
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <h4 className="merriweather-light m-0">{editing ? "Edit" : "Add"} Passkey</h4>
            </div>
            <div className="add-passkey-container">
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                <div>
                    <form method="post" action="#" className="mb-3 border p-3"
                        onSubmit={handleAddPassKey}>
                        <div className="mb-1">
                            <label htmlFor="account" className="form-label merriweather-light">Account</label>
                            <input type="text" className="form-control merriweather-light" id="account"
                                value={account} onChange={e => {
                                    if (!editing) {
                                        setAccount(e.target.value);
                                    }
                                }}
                                disabled={editing}/>
                        </div>
                        <div className="mb-1">
                            <label htmlFor="username" className="form-label merriweather-light">Username</label>
                            <input type="text" className="form-control merriweather-light" id="username"
                                value={username} onChange={e => {
                                    if (!editing) {
                                        setUsername(e.target.value);
                                    }
                                }}
                                disabled={editing}/>
                        </div>
                        <div className="mb-1">
                            <label htmlFor="password" className="form-label merriweather-light">Password</label>
                            <input type="text" className="form-control merriweather-light" id="password"
                                value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <div className="d-flex justify-content-end mt-3">
                            <button type="submit" className="btn btn-success merriweather-light w-100"
                                disabled={loading}>
                                    {loading && <div className="spinner-border spinner-border-sm mr-3" role="status"></div>}
                                    {loading ? (editing ? "Updating" : "Adding") : (editing ? "Update" : "Add")}
                            </button>
                        </div>
                    </form>
                </div>
                <div>
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
                </div>
                <div>
                    {filteredAccounts.map(account => (
                        <div className="d-flex align-items-start justify-content-between account-provider"
                            key={account} onClick={e => handleSelectAccount(account)}>
                            <div className="d-flex align-items-center">
                                <AccountIcon account={account} />
                                <h4 className="m-0 merriweather-light">{account}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
