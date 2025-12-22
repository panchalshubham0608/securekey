import { fromBase64, toBase64 } from "./cryptoHelpers";

/**
 * Encrypt a plaintext password using MEK
 * @param {string} plaintext
 * @param {Uint8Array} mek
 * @returns {{ ciphertext: string, iv: string, version: number }}
 */
export const encryptWithMEK = async ({ plaintext, mek }) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const mekKey = await crypto.subtle.importKey(
    "raw",
    mek,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    mekKey,
    new TextEncoder().encode(plaintext)
  );

  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(iv),
    version: 2
  };
};

/**
 * Decrypt vault item password using MEK
 * @param {{ ciphertext: string, iv: string }} encrypted
 * @param {Uint8Array} mek
 * @returns {string} plaintext password
 */
export const decryptWithMEK = async ({ encrypted, mek }) => {
  const mekKey = await crypto.subtle.importKey(
    "raw",
    mek,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(encrypted.iv)
    },
    mekKey,
    fromBase64(encrypted.ciphertext)
  );

  return new TextDecoder().decode(decrypted);
};
