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

// Local in-memory demo store used only when Firebase .env is not configured
let localDemoItems = [
  {
    id: "demo-1",
    account: "GitHub",
    username: "shubham@dev.io",
    plainPassword: "Gh#9xK!2mPq8$vL4",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    history: [
      {
        plainPassword: "Gh#OldPass2025!x9",
        updatedAt: Date.now() - 60 * 24 * 60 * 60 * 1000
      }
    ]
  },
  {
    id: "demo-2",
    account: "AWS",
    username: "admin@cloud-ops.dev",
    plainPassword: "Aws!7zR@4n Wq9#kM2".replace(" ", ""),
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
    history: []
  },
  {
    id: "demo-3",
    account: "Google",
    username: "shubham.panchal@gmail.com",
    plainPassword: "Gg$5vB*8pLm3!xQ7",
    createdAt: Date.now() - 220 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    history: []
  },
  {
    id: "demo-4",
    account: "Docker",
    username: "containers_prod",
    plainPassword: "Dk^3mN&9cXz1@rT6",
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    history: []
  }
];

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

  if (!db) {
    const exists = localDemoItems.some(
      (item) => item.account === account && item.username === username
    );
    if (exists) {
      throw new Error(
        `An entry for "${account}" with username "${username}" already exists`
      );
    }
    localDemoItems.push({
      id: `demo-${Date.now()}`,
      account,
      username,
      plainPassword: password,
      history: history.map((h) => ({
        plainPassword: h.password,
        updatedAt: h.updatedAt || Date.now()
      })),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return;
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
  if (!db) {
    return localDemoItems.map((item) => ({
      id: item.id,
      account: item.account,
      username: item.username,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  }

  const ref = vaultsCollectionReference(uid);
  const snap = await getDocs(ref);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
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
  if (!db) {
    const match = localDemoItems.find(
      (item) => item.account === account && item.username === username
    );
    if (!match) {
      throw new Error("No matching vault entry found");
    }
    return match.plainPassword;
  }

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

  if (!db) {
    const match = localDemoItems.find((item) => item.id === itemId);
    if (!match) {
      throw new Error("Vault item not found");
    }
    return {
      id: match.id,
      account: match.account,
      username: match.username,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt
    };
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

  if (!db) {
    const idx = localDemoItems.findIndex((item) => item.id === itemId);
    if (idx === -1) {
      throw new Error("Vault item not found");
    }
    const current = localDemoItems[idx];
    localDemoItems[idx] = {
      ...current,
      plainPassword: newPassword,
      history: [
        ...(current.history || []),
        {
          plainPassword: current.plainPassword,
          updatedAt: current.updatedAt
        }
      ],
      updatedAt: Date.now()
    };
    return;
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

  if (!db) {
    localDemoItems = localDemoItems.filter((item) => item.id !== itemId);
    return;
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
  if (!db) {
    const match = localDemoItems.find((item) => item.id === itemId);
    if (!match) {
      throw new Error("Vault item not found");
    }
    const historyEntries = (match.history || []).map((entry) => ({
      password: entry.plainPassword,
      updatedAt: entry.updatedAt
    }));
    return {
      id: match.id,
      account: match.account,
      username: match.username,
      history: historyEntries.reverse()
    };
  }

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
  };
};