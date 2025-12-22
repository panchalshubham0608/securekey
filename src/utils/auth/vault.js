import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  decryptMEK,
  deriveKEKFromPassword,
  encryptMEK,
  fromBase64,
  generateMEK,
  generateSalt,
  toBase64
} from "../crypto/cryptoHelpers";
import { db } from "../firebase/firebase";
import { usersCollectionName } from "../firestore/collection";

// Provides a reference to the document that stores user's crypto metadata
const userCryptoMetaReference = ({ uid }) => doc(db, usersCollectionName, uid, "meta", "crypto");

// A vault is initialized after Firebase creates the user as follows:
// 1. Generate Master Encryption Key
// 2. Generate salt for password KDF
// 3. Derive KEK from password
// 4. Encrypt MEK with KEK
// 5. Store crypto metadata in Firestore
// 6. Return MEK (caller keeps it in memory only)
export const initializeVault = async ({ uid, password }) => {
  const mek = generateMEK();
  const salt = generateSalt();
  const kek = await deriveKEKFromPassword(password, salt);
  const encryptedMEK = await encryptMEK(mek, kek);
  const ref = userCryptoMetaReference({ uid });
  const cryptoMetaDoc = {
    kdf: "PBKDF2",
    hash: "SHA-256",
    iterations: 310000,
    salt: toBase64(salt),
    encryptedMEK_password: encryptedMEK,
    createdAt: serverTimestamp()
  };

  await setDoc(ref, cryptoMetaDoc);

  return mek;
};

// UnlockVault retrieves the MEK (Master Encryption Key) which will be used to decrypt/encrypt user's list of passwords.
// 1. Fetch stored crypto metadata in Firestore
// 2. Derive KEK from password
// 3. Decrypt encrypted MEK with KEK
export const unlockVault = async ({ user, password }) => {
  const cryptoRef = userCryptoMetaReference({ uid: user.uid });
  const snap = await getDoc(cryptoRef);

  if (!snap.exists()) {
    throw new Error("Crypto metadata not found");
  }

  const {
    encryptedMEK_password,
    salt,
    iterations
  } = snap.data();

  const kek = await deriveKEKFromPassword(
    password,
    fromBase64(salt),
    iterations
  );

  const mek = await decryptMEK(encryptedMEK_password, kek);

  return mek;
};
