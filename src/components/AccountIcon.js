import React from "react";
import AccountIconsList from "../utils/AccountIconsList";
import OtherIcon from "../assets/Other.svg";

export default function AccountIcon(props) {
    const { account } = props;
    let icon = OtherIcon;
    if (AccountIconsList[account]) {
        icon = AccountIconsList[account];
    }
    return (
        <img src={icon} alt={account} className="account-logo" />
    );
}
