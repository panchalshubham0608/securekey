import { decryptMEKFromDevice, encryptMEKForDevice, generateDeviceKey } from "../crypto/cryptoHelpers";

const ENCRYPTED_MEK_KEY = "encryptedMEK";
const DEVICE_KEY_DB = "deviceKey";

/**
 * Save a CryptoKey to IndexedDB (as JWK)
 */
const saveDeviceKeyToIndexedDB = async (deviceKey) => {
  const exportedKey = await crypto.subtle.exportKey("jwk", deviceKey);
  localStorage.setItem(DEVICE_KEY_DB, JSON.stringify(exportedKey));
};

/**
 * Load a CryptoKey from IndexedDB (as JWK)
 */
const loadDeviceKeyFromIndexedDB = async () => {
  const storedKey = localStorage.getItem(DEVICE_KEY_DB);
  if (!storedKey) return null;

  const jwk = JSON.parse(storedKey);
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Clears the saved data on the device.
 */
export const clearStorage = () => {
  localStorage.removeItem(ENCRYPTED_MEK_KEY);
  localStorage.removeItem(DEVICE_KEY_DB);
};

/**
 * Saves MEK encrypted with device-key to localStorage
 * @param {Uint8Array} mek
 */
export const saveMEKToDevice = async ({ mek }) => {
  // 1️⃣ Load existing device key or generate new one
  let deviceKey = await loadDeviceKeyFromIndexedDB();
  if (!deviceKey) {
    deviceKey = await generateDeviceKey();
    await saveDeviceKeyToIndexedDB(deviceKey);
  }

  // 2️⃣ Encrypt MEK with device key
  const encrypted = await encryptMEKForDevice({ mek, deviceKey });

  // 3️⃣ Save encrypted MEK to localStorage
  localStorage.setItem(ENCRYPTED_MEK_KEY, JSON.stringify(encrypted));

  return deviceKey; // keep in memory for current session
};

/**
 * Reads MEK from local device and decrypts with device key
 * @returns {Uint8Array | null} decrypted MEK or null if not found
 */
export const readMEKFromDevice = async () => {
  const deviceKey = await loadDeviceKeyFromIndexedDB();
  if (!deviceKey) return null;

  const stored = localStorage.getItem(ENCRYPTED_MEK_KEY);
  if (!stored) return null;

  const encryptedMEK = JSON.parse(stored);
  const mek = await decryptMEKFromDevice({ encryptedMEK, deviceKey });

  return mek;
};
