/**
 * quickUnlockService.js
 *
 * Device-based Quick Unlock using WebAuthn + local cryptography.
 *
 * Security model:
 * - deviceKey (256-bit random) stored locally in IndexedDB
 * - MEK encrypted using deviceKey and stored in localStorage
 * - WebAuthn used ONLY to require biometric / PIN verification
 *
 * Guarantees:
 * ✅ No plaintext MEK at rest
 * ✅ Biometric / PIN required to unlock
 * ✅ Device-bound (not synced)
 * ❌ Not resistant to XSS (same as all web vaults)
 */

import { idbDelete, idbGet, idbSet } from "./idb";

const ENCRYPTED_MEK_KEY = "encrypted_mek";
const DEVICE_KEY_IDB_KEY = "device_key";
const CREDENTIAL_ID_KEY = "credential_id";

/* ------------------------------------------------------------------ */
/* Base64 helpers                                                      */
/* ------------------------------------------------------------------ */

export const base64UrlToArrayBuffer = (base64url) => {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const arrayBufferToBase64Url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/* ------------------------------------------------------------------ */
/* WebAuthn helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Creates WebAuthn credential (one-time per device)
 */
async function createWebAuthnCredential({ user }) {
  if (!user.email) throw new Error("Could not verify user authentication");
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "SecureKey Vault" },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: user.email,
        displayName: user.displayName || user.email,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        userVerification: "required",
      },
      timeout: 60000,
    },
  });

  const credentialId = arrayBufferToBase64Url(credential.rawId);
  await idbSet(CREDENTIAL_ID_KEY, credentialId);

  return credentialId;
}

/**
 * Requires biometric / PIN verification
 */
async function requireUserVerification(credentialId) {
  await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [
        {
          id: base64UrlToArrayBuffer(credentialId),
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  });
}

/* ------------------------------------------------------------------ */
/* Cryptography                                                        */
/* ------------------------------------------------------------------ */

/**
 * Generates random device key
 */
function generateDeviceKey() {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Encrypts MEK using deviceKey
 */
async function encryptMEK({ mek, deviceKey }) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.importKey(
    "raw",
    deviceKey,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    mek
  );

  return {
    iv: arrayBufferToBase64Url(iv),
    ciphertext: arrayBufferToBase64Url(ciphertext),
  };
}

/**
 * Decrypts MEK using deviceKey
 */
async function decryptMEK({ encrypted, deviceKey }) {
  const key = await crypto.subtle.importKey(
    "raw",
    deviceKey,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const mek = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64UrlToArrayBuffer(encrypted.iv),
    },
    key,
    base64UrlToArrayBuffer(encrypted.ciphertext)
  );

  return new Uint8Array(mek);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Enables Quick Unlock on this device
 * Call AFTER user enters master password
 */
export async function enableQuickUnlock({ user, mek }) {
  let credentialId = await idbGet(CREDENTIAL_ID_KEY);
  if (!credentialId) {
    credentialId = await createWebAuthnCredential({ user });
  }

  // Require biometric once during setup
  await requireUserVerification(credentialId);

  const deviceKey = generateDeviceKey();
  await idbSet(DEVICE_KEY_IDB_KEY, deviceKey);

  const encryptedMEK = await encryptMEK({ mek, deviceKey });
  localStorage.setItem(ENCRYPTED_MEK_KEY, JSON.stringify(encryptedMEK));
}

/**
 * Attempts Quick Unlock using biometric / PIN
 * Returns decrypted MEK or null
 */
export async function quickUnlock() {
  const credentialId = await idbGet(CREDENTIAL_ID_KEY);
  const deviceKey = await idbGet(DEVICE_KEY_IDB_KEY);
  const encryptedMEK = localStorage.getItem(ENCRYPTED_MEK_KEY);

  if (!credentialId || !deviceKey || !encryptedMEK) {
    return null;
  }

  // Biometric gate
  await requireUserVerification(credentialId);

  return decryptMEK({
    encrypted: JSON.parse(encryptedMEK),
    deviceKey,
  });
}

/**
 * Returns true if quick unlock is enabled on this device
 */
export async function isQuickUnlockEnabled() {
  return !!(
    (await idbGet(CREDENTIAL_ID_KEY)) &&
    (await idbGet(DEVICE_KEY_IDB_KEY)) &&
    localStorage.getItem(ENCRYPTED_MEK_KEY)
  );
}

/**
 * Disables Quick Unlock on this device
 */
export async function disableQuickUnlock() {
  await idbDelete(CREDENTIAL_ID_KEY);
  await idbDelete(DEVICE_KEY_IDB_KEY);
  localStorage.removeItem(ENCRYPTED_MEK_KEY);
}

/**
 * Checks browser support
 */
export function isQuickUnlockSupported() {
  return (
    window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.get === "function"
  );
}
