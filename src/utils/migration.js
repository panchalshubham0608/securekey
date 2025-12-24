import { doc, getDoc, updateDoc } from "firebase/firestore";
import { decrypt } from "./cryptoutil";
import { firestoreDb as oldDb } from "./firebase";
import { keysCollectionName } from "./firestoredb";
import { addVaultItem } from "./vault/vaultService";

// Old method for decoding user's password
const oldDecode = async ({ ciphertext, key }) => {
  const password = await decrypt({ ciphertext, key });
  if (!password) throw new Error("Failed to decode old password");
  return password;
}

// Builds the old password object
const buildLegacyPasswordObject = async ({ itemId, password }) => {
  const oldDocRef = doc(oldDb, keysCollectionName, itemId);
  const oldSnap = await getDoc(oldDocRef);

  if (!oldSnap.exists()) {
    throw new Error("Legacy key not found");
  }

  const oldData = oldSnap.data();

  // Decrypt main password
  const decryptedPassword = await oldDecode({
    ciphertext: oldData.password,
    key: password,
  });

  // Decrypt history (if any)
  const decryptedHistory = Array.isArray(oldData.history)
    ? await Promise.all(
      oldData.history.map(async (h) => ({
        ...h,
        password: await oldDecode({
          ciphertext: h.password,
          key: password,
        }),
        updatedAt: h.changedAt,
      }))
    )
    : [];

  return {
    account: oldData.account,
    username: oldData.username,
    password: decryptedPassword,
    history: decryptedHistory,
    createdAt: oldData.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
};

export const migrate = async ({ uid, itemId, password, mek }) => {
  const legacyItem = await buildLegacyPasswordObject({
    itemId,
    password,
  });

  await addVaultItem({
    uid,
    mek,
    account: legacyItem.account,
    username: legacyItem.username,
    password: legacyItem.password,
    history: legacyItem.history || [],
  });

  await updateDoc(doc(oldDb, keysCollectionName, itemId), {
    migrated: true,
    migratedAt: Date.now(),
  });

  return { success: true };
};
