import React from "react";
import AccountIconsList from "../utils/AccountIconsList";

export default function AccountIcon(props) {
  const { account } = props;
  let icon = AccountIconsList["Other"];
  if (AccountIconsList[account]) {
    icon = AccountIconsList[account];
  }
  return (
    <img src={icon} alt={account} className="account-logo" />
  );
}
