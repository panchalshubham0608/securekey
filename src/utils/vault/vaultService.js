import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { decryptWithMEK, encryptWithMEK } from "../crypto/vaultCrypto";
import { db } from "../firebase/firebase";
import { vaultsCollectionName } from "../firestore/collection";

// Provides a reference to the vaults collection
const vaultsCollectionReference = (uid) => collection(db, vaultsCollectionName, uid, "items");
const vaultsDocReference = ({ uid, itemId }) => doc(db, vaultsCollectionName, uid, "items", itemId);

/**
 * Add a new vault item
 * Throws error if (account, username) already exists
 */
export const addVaultItem = async ({
  uid,
  mek,
  account,
  username,
  password,
  history = []
}) => {
  if (!account || !username || !password) {
    throw new Error("Missing required fields");
  }

  const itemsRef = vaultsCollectionReference(uid);

  // 1️⃣ Check for duplicate (account + username)
  const q = query(
    itemsRef,
    where("account", "==", account),
    where("username", "==", username)
  );

  const existingSnap = await getDocs(q);

  if (!existingSnap.empty) {
    throw new Error(
      `An entry for "${account}" with username "${username}" already exists`
    );
  }

  // 2️⃣ Encrypt password with MEK
  const encryptedPassword = await encryptWithMEK({ plaintext: password, mek });
  const encryptedHistory = await Promise.all(
    history.map(async (h) => ({
      ...h,
      password: await encryptWithMEK({
        plaintext: h.password,
        mek,
      }),
    }))
  );

  // 3️⃣ Insert new vault item
  await addDoc(itemsRef, {
    account,
    username,
    password: encryptedPassword,
    history: encryptedHistory,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
};


/**
 * Lists all vault items WITHOUT password field
 * Used for dashboard listing
 */
export const listVaultItems = async ({ uid }) => {
  const ref = vaultsCollectionReference(uid);
  const snap = await getDocs(ref);

  return snap.docs.map(doc => {
    const data = doc.data();

    return {
      id: doc.id,
      account: data.account,
      username: data.username,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
      // 🚫 password intentionally excluded
    };
  });
};

/**
 * Retrieves decrypted password for a given (account, username)
 */
export const getPasswordByAccountAndUsername = async ({
  uid,
  account,
  username,
  mek
}) => {
  const ref = vaultsCollectionReference(uid);
  const q = query(
    ref,
    where("account", "==", account),
    where("username", "==", username)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("No matching vault entry found");
  }

  if (snap.size > 1) {
    // Should never happen if uniqueness is enforced
    throw new Error("Duplicate vault entries detected");
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data();

  const decryptedPassword = await decryptWithMEK({ encrypted: data.password, mek });
  return decryptedPassword;
};

/**
 * Fetch a vault item by itemId (without password)
 */
export const getVaultItemById = async ({ uid, itemId }) => {
  if (!uid || !itemId) {
    throw new Error("Missing uid or itemId");
  }

  const ref = vaultsDocReference({ uid, itemId });
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Vault item not found");
  }

  const data = snap.data();

  return {
    id: snap.id,
    account: data.account,
    username: data.username,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
    // 🚫 password excluded
  };
};

/**
 * Updates password for a vault item and stores history
 */
export const updateVaultItem = async ({
  uid,
  itemId,
  mek,
  newPassword
}) => {
  if (!uid || !itemId || !mek || !newPassword) {
    throw new Error("Missing required parameters");
  }

  const ref = vaultsDocReference({ uid, itemId });
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Vault item not found");
  }

  const data = snap.data();

  // 1️⃣ Encrypt new password
  const encryptedNewPassword = await encryptWithMEK({ plaintext: newPassword, mek });

  // 2️⃣ Push old password into history
  const history = [
    ...(data.history || []),
    {
      password: data.password,
      updatedAt: data.updatedAt
    }
  ];

  // 3️⃣ Update document
  await updateDoc(ref, {
    password: encryptedNewPassword,
    history,
    updatedAt: Date.now()
  });
};

/**
 * Deletes a vault item by itemId
 */
export const deleteVaultItem = async ({ uid, itemId }) => {
  if (!uid || !itemId) {
    throw new Error("Missing uid or itemId");
  }

  const ref = vaultsDocReference({ uid, itemId });
  await deleteDoc(ref);
};

/**
 * Retrieves the history of passwords for a vault item
 * @param {string} uid - User ID
 * @param {string} itemId - Vault item ID
 * @param {Uint8Array} mek - Master Encryption Key
 * @returns {Promise<Array<{password: string, changedAt: number}>>}
 */
export const getVaultItemHistory = async ({ uid, itemId, mek }) => {
  try {
    const itemRef = vaultsDocReference({ uid, itemId });
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      throw new Error("Vault item not found");
    }

    const data = itemSnap.data();
    if (!data.history || !Array.isArray(data.history)) {
      return [];
    }

    // Decrypt all password entries in history
    const decryptedHistory = await Promise.all(
      data.history.map(async (entry) => {
        return {
          password: await decryptWithMEK({ encrypted: entry.password, mek }),
          updatedAt: entry.updatedAt
        };
      })
    );

    return {
      id: itemSnap.id,
      account: data.account,
      username: data.username,
      history: decryptedHistory.reverse(),
    }
  } catch (error) {
    console.error("Error fetching vault history", error);
    throw error;
  }
};