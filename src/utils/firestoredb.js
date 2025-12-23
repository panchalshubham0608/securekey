// imports
import "firebase/firestore";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getUserFromContext } from "./contextutil";
import { validateUserContext } from "./contextvalidator";
import { decrypt, encrypt } from "./cryptoutil";
import { formatFirestoreTimestamp } from "./dateutil";
import { firestoreDb } from "./firebase";

// Firestore collection details
export const keysCollectionName = process.env.REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME;
const keysCollection = collection(firestoreDb, keysCollectionName);

// Function to get passkeys for a user
export const getPassKeys = ({ username }) => {
  return new Promise((resolve, reject) => {
    let owner = username;
    const q = query(keysCollection, where("owner", "==", owner));
    getDocs(q)
      .then((querySnapshot) => {
        // map the documents to an array of objects
        const matchingKeys = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // delete "password" field from each object
        matchingKeys.forEach((key) => {
          delete key.password;
          if (key["history"]) {
            delete key["history"];
          }
        });
        // return matchingKeys;
        resolve(matchingKeys);
      })
      .catch((error) => {
        console.error("Error getting documents from Firestore: ", error);
        reject({ message: "Error getting documents from Firestore" });
      });
  });
};

// Function to fetch passkey value
export const getPassKeyValue = ({ userContext, account, username }) => {
  return new Promise((resolve, reject) => {
    validateUserContext(userContext)
      .then((userContext) => {
        let owner = userContext.user.username;
        const q = query(
          keysCollection,
          where("owner", "==", owner),
          where("account", "==", account),
          where("username", "==", username),
          limit(1)
        );
        getDocs(q)
          .then((querySnapshot) => {
            if (querySnapshot.empty) {
              reject({ message: "Passkey not found" });
              return;
            }
            // get the encrypted passkey
            let ciphertext = querySnapshot.docs[0].data().password;
            try {
              let secretKey = getUserFromContext(userContext.user).password;
              let password = decrypt({ ciphertext, key: secretKey });
              resolve(password);
            } catch (error) {
              console.error("Error decrypting passkey: ", error);
              reject({ message: "Error decrypting passkey" });
            }
          })
          .catch((error) => {
            console.error("Error getting documents from Firestore: ", error);
            reject({ message: "Error getting documents from Firestore" });
          });
      })
      .catch((error) => {
        console.error("Error validating user context: ", error);
        reject({ message: "Error validating user context" });
      });
  });
};

// Function to add a new passkey
export const addPassKey = ({ userContext, account, username, password }) => {
  return new Promise((resolve, reject) => {
    validateUserContext(userContext)
      .then((userContext) => {
        let owner = userContext.user.username;

        // decode user context to get the secret key
        let secretKey;
        try {
          secretKey = getUserFromContext(userContext.user).password;
        } catch (error) {
          console.error("Error getting user from context: ", error);
          reject({ message: "Error decoding user context" });
          return;
        }

        // encrypt the passkey
        let ciphertext;
        try {
          ciphertext = encrypt({ plaintext: password, key: secretKey });
        } catch (error) {
          console.error("Error encrypting passkey: ", error);
          reject({ message: "Error encrypting passkey" });
          return;
        }

        // check if the passkey already exists
        const q = query(
          keysCollection,
          where("owner", "==", owner),
          where("account", "==", account),
          where("username", "==", username),
          limit(1)
        );
        getDocs(q)
          .then((querySnapshot) => {
            if (!querySnapshot.empty) {
              reject({ message: "Passkey already exists" });
            } else {
              // create a new passkey
              addDoc(keysCollection, {
                owner,
                account,
                username,
                password: ciphertext,
                history: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              })
                .then(() => {
                  resolve();
                })
                .catch((error) => {
                  console.error("Error saving passkey to Firestore: ", error);
                  reject({ message: "Error saving passkey to Firestore" });
                });
            }
          })
          .catch((error) => {
            console.error("Error getting documents from Firestore: ", error);
            reject({ message: "Error getting documents from Firestore" });
          });
      })
      .catch((error) => {
        console.error("Error validating user context: ", error);
        reject({ message: "Error validating user context" });
      });
  });
};

// Function to update an existing passkey
export const updatePassKey = ({ userContext, account, username, password }) => {
  return new Promise((resolve, reject) => {
    validateUserContext(userContext)
      .then((userContext) => {
        let owner = userContext.user.username;

        // decode user context to get the secret key
        let secretKey;
        try {
          secretKey = getUserFromContext(userContext.user).password;
        } catch (error) {
          console.error("Error getting user from context: ", error);
          reject({ message: "Error decoding user context" });
          return;
        }

        // encrypt the passkey
        let ciphertext;
        try {
          ciphertext = encrypt({ plaintext: password, key: secretKey });
        } catch (error) {
          console.error("Error encrypting passkey: ", error);
          reject({ message: "Error encrypting passkey" });
          return;
        }

        // check if the passkey already exists
        const q = query(
          keysCollection,
          where("owner", "==", owner),
          where("account", "==", account),
          where("username", "==", username),
          limit(1)
        );
        getDocs(q)
          .then((querySnapshot) => {
            if (querySnapshot.empty) {
              reject({ message: "Passkey not found" });
              return;
            }
            // update the existing passkey
            let now = Date.now();
            let docRef = querySnapshot.docs[0].ref;
            let data = querySnapshot.docs[0].data();
            let history = [
              ...(data["history"] || []),
              { password: data.password, changedAt: now },
            ];
            updateDoc(docRef, {
              password: ciphertext,
              history,
              updatedAt: now,
            })
              .then(() => {
                resolve();
              })
              .catch((error) => {
                console.error("Error updating passkey in Firestore: ", error);
                reject({ message: "Error updating passkey in Firestore" });
              });
          })
          .catch((error) => {
            console.error("Error getting documents from Firestore: ", error);
            reject({ message: "Error getting documents from Firestore" });
          });
      })
      .catch((error) => {
        console.error("Error validating user context: ", error);
        reject({ message: "Error validating user context" });
      });
  });
};

// Function to delete a passkey
export const deletePassKey = ({ userContext, account, username }) => {
  return new Promise((resolve, reject) => {
    validateUserContext(userContext)
      .then((userContext) => {
        let owner = userContext.user.username;
        const q = query(
          keysCollection,
          where("owner", "==", owner),
          where("account", "==", account),
          where("username", "==", username),
          limit(1)
        );
        getDocs(q)
          .then((querySnapshot) => {
            if (querySnapshot.empty) {
              reject({ message: "Passkey not found" });
              return;
            }
            deleteDoc(querySnapshot.docs[0].ref)
              .then(() => {
                resolve();
              })
              .catch((error) => {
                console.error("Error deleting passkey from Firestore: ", error);
                reject({ message: "Error deleting passkey from Firestore" });
              });
          })
          .catch((error) => {
            console.error("Error getting documents from Firestore: ", error);
            reject({ message: "Error getting documents from Firestore" });
          });
      })
      .catch((error) => {
        console.error("Error validating user context: ", error);
        reject({ message: "Error validating user context" });
      });
  });
};

// Function to get history
export const getHistory = ({ userContext, account, username }) => {
  return new Promise((resolve, reject) => {
    validateUserContext(userContext)
      .then((userContext) => {
        let owner = userContext.user.username;

        // decode user context to get the secret key
        let secretKey;
        try {
          secretKey = getUserFromContext(userContext.user).password;
        } catch (error) {
          console.error("Error getting user from context: ", error);
          reject({ message: "Error decoding user context" });
          return;
        }

        const q = query(
          keysCollection,
          where("owner", "==", owner),
          where("account", "==", account),
          where("username", "==", username),
          limit(1)
        );
        getDocs(q)
          .then((querySnapshot) => {
            if (querySnapshot.empty) {
              reject({ message: "Passkey not found" });
              return;
            }
            let data = querySnapshot.docs[0].data();
            let history = data["history"] || [];
            let decryptedHistory = [];
            for (let lp of history) {
              // get the encrypted passkey
              let password = null;
              try {
                password = decrypt({
                  ciphertext: lp.password,
                  key: secretKey,
                });
              } catch (error) {
                console.error("Error decrypting passkey: ", error);
                return reject({ message: "Error decrypting passkey" });
              }

              let changedAt = null;
              try {
                changedAt = formatFirestoreTimestamp(lp.changedAt);
              } catch (error) {
                console.error("Error formatting timestamp: ", error);
                return reject({ message: "Error formatting timestamp" });
              }

              // add password to list
              decryptedHistory.push({
                password,
                changedAt,
              });
            }

            // reverse the contents
            decryptedHistory = decryptedHistory.reverse();
            resolve(decryptedHistory);
          })
          .catch((error) => {
            console.error("Error getting documents from Firestore: ", error);
            reject({ message: "Error getting documents from Firestore" });
          });
      })
      .catch((error) => {
        console.error("Error validating user context: ", error);
        reject({ message: "Error validating user context" });
      });
  });
};
