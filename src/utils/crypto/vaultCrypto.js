import { toBase64 } from "./cryptoHelpers";

export const encryptVaultValue = async (plaintext, mek) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.importKey(
    "raw",
    mek,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv)
  };
};

export const decryptVaultValue = async (encrypted, mek) => {
  const key = await crypto.subtle.importKey(
    "raw",
    mek,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(encrypted.iv)
    },
    key,
    fromBase64(encrypted.ciphertext)
  );

  return new TextDecoder().decode(plaintext);
};
