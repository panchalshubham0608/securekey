// imports
import { addDoc, collection, deleteDoc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { firestoreDb } from "./firebase";
import "firebase/firestore";
import { decrypt, encrypt } from "./cryptoutil";
import { getUserFromContext } from "./contextutil";

// Firestore collection details
const keysCollectionName = process.env.REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME;
const keysCollection = collection(firestoreDb, keysCollectionName);

// Function to get passkeys for a user
export const getPassKeys = ({ userContext }) => {
  return new Promise((resolve, reject) => {
    validateUserContext(userContext).then(userContext => {
      let owner = userContext.user.username;
      const q = query(keysCollection, where("owner", "==", owner));
      getDocs(q).then((querySnapshot) => {
        // map the documents to an array of objects
        const matchingKeys = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // delete "password" field from each object
        matchingKeys.forEach(key => delete key.password);
        // return matchingKeys;
        resolve(matchingKeys);
      }).catch((error) => {
        console.error("Error getting documents from Firestore: ", error);
        reject({ message: "Error getting documents from Firestore" });
      });
    }).catch(error => {
      console.error("Error validating user context: ", error);
      reject({ message: "Error validating user context" });
    });

  });
}

// Function to fetch passkey value
export const getPassKeyValue = ({ userContext, account, username }) => {
  return new Promise((resolve, reject) => {
    validateUserContext(userContext).then(userContext => {
      let owner = userContext.user.username;
      const q = query(keysCollection, where("owner", "==", owner), where("account", "==", account), where("username", "==", username), limit(1));
      getDocs(q).then((querySnapshot) => {
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
      }).catch((error) => {
        console.error("Error getting documents from Firestore: ", error);
        reject({ message: "Error getting documents from Firestore" });
      });
    }).catch(error => {
      console.error("Error validating user context: ", error);
      reject({ message: "Error validating user context" });
    });
  });
}

// Function to add a new passkey
export const addPassKey = ({ userContext, account, username, password }) => {
  return new Promise((resolve, reject) => {
    validateUserContext(userContext).then(userContext => {
      let owner = userContext.user.username;
      let secretKey = getUserFromContext(userContext.user).password;

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
      const q = query(keysCollection, where("owner", "==", owner), where("account", "==", account), where("username", "==", username), limit(1));
      getDocs(q).then((querySnapshot) => {
        if (!querySnapshot.empty) {
          reject({ message: "Passkey already exists" });
        } else {
          // create a new passkey
          addDoc(keysCollection, {
            owner,
            account,
            username,
            password: ciphertext,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }).then(() => {
            resolve();
          }).catch((error) => {
            console.error("Error saving passkey to Firestore: ", error);
            reject({ message: "Error saving passkey to Firestore" });
          });
        }
      }).catch((error) => {
        console.error("Error getting documents from Firestore: ", error);
        reject({ message: "Error getting documents from Firestore" });
      });
    }).catch(error => {
      console.error("Error validating user context: ", error);
      reject({ message: "Error validating user context" });
    });
  });
}

// Function to update an existing passkey
export const updatePassKey = ({ userContext, account, username, password }) => {
  return new Promise((resolve, reject) => {
    try {
      userContext = validateUserContext(userContext);
    } catch (error) {
      console.error("Error validating user context: ", error);
      reject({ message: "Error validating user context" });
    }

    let owner = userContext.user.username;
    let secretKey = getUserFromContext(userContext.user).password;

    // encrypt the passkey
    let ciphertext;
    try {
      ciphertext = encrypt({ plaintext: password, key: secretKey });
    } catch (error) {
      console.error("Error encrypting passkey: ", error);
      reject({ message: "Error encrypting passkey" });
    }

    // check if the passkey already exists
    const q = query(keysCollection, where("owner", "==", owner), where("username", "==", username), where("account", "==", account), limit(1));
    getDocs(q).then((querySnapshot) => {
      if (querySnapshot.empty) {
        reject({ message: "Passkey not found" });
      } else {
        // update the existing passkey
        let docRef = querySnapshot.docs[0].ref;
        updateDoc(docRef, {
          password: ciphertext,
          updatedAt: Date.now(),
        }).then(() => {
          resolve();
        }).catch((error) => {
          console.error("Error updating passkey in Firestore: ", error);
          reject({ message: "Error updating passkey in Firestore" });
        });
      }
    }).catch((error) => {
      console.error("Error getting documents from Firestore: ", error);
      reject({ message: "Error getting documents from Firestore" });
    });
  });
}

// Function to delete a passkey
export const deletePassKey = ({ userContext, account, username }) => {
  return new Promise((resolve, reject) => {
    userContext = validateUserContext(userContext);
    let owner = userContext.user.username;
    const q = query(keysCollection, where("owner", "==", owner), where("username", "==", username), where("account", "==", account), limit(1));
    getDocs(q).then((querySnapshot) => {
      if (querySnapshot.empty) {
        reject({ message: "Passkey not found" });
      }
      deleteDoc(querySnapshot.docs[0].ref).then(() => {
        resolve();
      }).catch((error) => {
        console.error("Error deleting passkey from Firestore: ", error);
        reject({ message: "Error deleting passkey from Firestore" });
      });
    }).catch((error) => {
      console.error("Error getting documents from Firestore: ", error);
      reject({ message: "Error getting documents from Firestore" });
    });
  });
}

// validate user context
const validateUserContext = (userContext) => {
  return new Promise((resolve, reject) => {
    if (!userContext) {
      reject("User context not found");
      return;
    }
    if (!userContext.user) {
      reject("User not found in user context");
      return;
    }
    if (!userContext.user.username) {
      reject("Username not found in user context");
      return;
    }
  
    if (!userContext.user.password) {
      reject("Password not found in user context");
      return;
    }
  
    resolve(userContext);
  });
}
