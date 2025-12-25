/**
 * quickUnlockService.js
 *
 * Implements device-based Quick Unlock using WebAuthn.
 *
 * Security model:
 * - A random deviceKey is generated per device
 * - deviceKey is wrapped using a WebAuthn-derived wrapping key
 * - MEK is encrypted using the deviceKey
 * - deviceKey can only be unwrapped after biometric / PIN verification
 *
 * This setup:
 * ✅ Does NOT store secrets in plaintext
 * ✅ Requires user presence (biometric/PIN)
 * ✅ Is device-bound
 * ❌ Does not sync across devices (by design)
 */


import { idbDelete, idbGet, idbSet } from "./idb";
const ENCRYPTED_MEK_KEY = "encrypted_mek";


/* ------------------------------------------------------------------ */
/* Utility helpers                                                     */
/* ------------------------------------------------------------------ */

const enc = new TextEncoder();

/**
 * Converts base64url → ArrayBuffer
 */
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

/**
 * Converts ArrayBuffer → base64url
 */
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
 * Creates a WebAuthn credential for this device
 * Must be called once during setup
 */
export async function createWebAuthnCredential() {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "SecureKey Vault" },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: "user",
        displayName: "Vault User",
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        userVerification: "required",
      },
      timeout: 60000,
    },
  });

  const credentialId = arrayBufferToBase64Url(credential.rawId);
  await idbSet("credentialId", credentialId);

  return credentialId;
}

/**
 * Requests biometric/PIN verification
 */
async function getAssertion({ credentialId }) {
  return navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [
        {
          id: base64UrlToArrayBuffer(credentialId),
          type: "public-key",
        },
      ],
      userVerification: "required",
    },
  });
}

/* ------------------------------------------------------------------ */
/* Cryptography helpers                                                */
/* ------------------------------------------------------------------ */

/**
 * Generates a random device key
 */
async function generateDeviceKey() {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Derives a wrapping key from WebAuthn assertion signature
 */
async function deriveWrappingKey(assertion) {
  const signature = assertion.response.signature;

  const baseKey = await crypto.subtle.importKey(
    "raw",
    signature,
    "HKDF",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(),
      info: enc.encode("device-key-wrap"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Wraps deviceKey using WebAuthn
 */
async function wrapDeviceKey({ deviceKey, assertion }) {
  const key = await deriveWrappingKey(assertion);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    deviceKey
  );

  return {
    iv: arrayBufferToBase64Url(iv),
    ciphertext: arrayBufferToBase64Url(ciphertext),
  };
}

/**
 * Unwraps deviceKey after biometric verification
 */
async function unwrapDeviceKey({ wrapped, assertion }) {
  const key = await deriveWrappingKey(assertion);

  const deviceKey = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64UrlToArrayBuffer(wrapped.iv),
    },
    key,
    base64UrlToArrayBuffer(wrapped.ciphertext)
  );

  return new Uint8Array(deviceKey);
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
 * Saves MEK securely for Quick Unlock
 * Called AFTER user enters master password
 */
export async function enableQuickUnlock({ mek }) {
  let credentialId = await idbGet("credentialId");
  if (!credentialId) {
    credentialId = await createWebAuthnCredential();
  }

  const assertion = await getAssertion({ credentialId });
  const deviceKey = await generateDeviceKey();

  const wrappedDeviceKey = await wrapDeviceKey({ deviceKey, assertion });
  await idbSet("wrappedDeviceKey", wrappedDeviceKey);

  const encryptedMEK = await encryptMEK({ mek, deviceKey });
  if (!encryptedMEK) throw new Error("Failed to encrypt MEK");
  localStorage.setItem(ENCRYPTED_MEK_KEY, JSON.stringify(encryptedMEK));
}

/**
 * Attempts Quick Unlock (biometric/PIN)
 * Returns decrypted MEK or null
 */
export async function quickUnlock() {
  const credentialId = await idbGet("credentialId");
  const wrappedDeviceKey = await idbGet("wrappedDeviceKey");
  const encryptedMEK = localStorage.getItem(ENCRYPTED_MEK_KEY);

  if (!credentialId || !wrappedDeviceKey || !encryptedMEK) {
    return null;
  }

  const assertion = await getAssertion({ credentialId });
  const deviceKey = await unwrapDeviceKey({ wrapped: wrappedDeviceKey, assertion });

  return decryptMEK({ encrypted: JSON.parse(encryptedMEK), deviceKey });
}

/**
 * Checks whether Quick Unlock is enabled on this device
 */
export async function isQuickUnlockEnabled() {
  return !!(
    (await idbGet("credentialId")) &&
    (await idbGet("wrappedDeviceKey")) &&
    localStorage.getItem(ENCRYPTED_MEK_KEY)
  );
}

/**
 * Disables Quick Unlock on this device
 */
export async function disableQuickUnlock() {
  await idbDelete("credentialId");
  await idbDelete("wrappedDeviceKey");
  localStorage.removeItem(ENCRYPTED_MEK_KEY);
}

/**
 * Checks whether quick unlock is supported
 */
export function isQuickUnlockSupported() {
  return (
    window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.create === "function"
  );
}
