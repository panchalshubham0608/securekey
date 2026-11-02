import React from "react";
import AccountIconsList from "../utils/AccountIconsList";

const PRESET_KEYS = Object.keys(AccountIconsList).filter((key) => key !== "Other");

function getInitials(account, username) {
  const source =
    account && account.trim() && account.trim().toLowerCase() !== "other"
      ? account.trim()
      : (username && username.trim()) || (account && account.trim()) || "?";

  const cleaned = source
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("@")[0]
    .trim();

  const words = cleaned
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  const single = words[0] || "?";
  return single.slice(0, 2).toUpperCase();
}

function getHueFromText(text) {
  const str = String(text || "securekey");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function generateProviderSvgDataUri(account, username) {
  const initials = getInitials(account, username);
  const seed =
    account && account.trim().toLowerCase() !== "other"
      ? account.trim().toLowerCase()
      : `${account || "other"}:${username || ""}`.toLowerCase();
  const hue1 = getHueFromText(seed);
  const hue2 = (hue1 + 38) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1}, 78%, 52%)" />
        <stop offset="100%" stop-color="hsl(${hue2}, 82%, 40%)" />
      </linearGradient>
      <radialGradient id="shine" cx="25%" cy="20%" r="65%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.28)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>
    <rect x="6" y="6" width="36" height="36" rx="8" fill="url(#bg)" />
    <rect x="6" y="6" width="36" height="36" rx="8" fill="url(#shine)" />
    <text
      x="50%"
      y="52%"
      dominant-baseline="central"
      text-anchor="middle"
      fill="#ffffff"
      font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
      font-weight="800"
      font-size="${initials.length > 1 ? 15 : 18}"
      letter-spacing="-0.4"
    >${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function AccountIcon(props) {
  const { account, username } = props;
  const normalized = (account || "").trim().toLowerCase();
  const matchedKey = PRESET_KEYS.find((k) => k.toLowerCase() === normalized);

  const icon = matchedKey
    ? AccountIconsList[matchedKey]
    : generateProviderSvgDataUri(account, username);

  return <img src={icon} alt={account || "Account"} className="account-logo" />;
}
