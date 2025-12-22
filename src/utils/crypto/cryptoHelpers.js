/* =========================
   Base64 helpers
========================= */

export const toBase64 = (buffer) => {
  const bytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : buffer;

  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
};

export const fromBase64 = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/* =========================
   Master Encryption Key
========================= */
export const generateMEK = () => {
  // 256-bit random key
  return crypto.getRandomValues(new Uint8Array(32));
};

export const generateSalt = () => {
  // 128-bit random key
  return crypto.getRandomValues(new Uint8Array(16));
};

export const generateDeviceKey = async () => {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable only if needed
    ["encrypt", "decrypt"]
  );
};

/* =========================
   Derive KEK from password
========================= */
export const deriveKEKFromPassword = async (
  password,
  salt,
  iterations = 310000
) => {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

/* =========================
   Encrypt MEK
========================= */
export const encryptMEK = async (mek, kek) => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM standard

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    kek,
    mek.buffer,
  );

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv)
  };
};

export const encryptMEKForDevice = async ({ mek, deviceKey }) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    deviceKey,
    mek.buffer
  );
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv)
  };
};

/* =========================
   Decrypt MEK
========================= */
export const decryptMEK = async (encryptedMEK, kek) => {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(encryptedMEK.iv)
    },
    kek,
    fromBase64(encryptedMEK.ciphertext)
  );

  return new Uint8Array(plaintext);
};

/**
 * Decrypts MEK previously encrypted for device
 * @param {{ ciphertext: string, iv: string }} encryptedMEK
 * @param {CryptoKey} deviceKey - AES-GCM key used to encrypt MEK
 * @returns {Uint8Array} decrypted MEK
 */
export const decryptMEKFromDevice = async ({ encryptedMEK, deviceKey }) => {
  const { ciphertext, iv } = encryptedMEK;

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(iv)
    },
    deviceKey,
    fromBase64(ciphertext)
  );

  return new Uint8Array(decryptedBuffer);
};