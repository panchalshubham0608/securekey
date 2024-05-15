// imports
import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = firebaseAuth.getAuth(app);

// Function to sign up with email and password
export const signUp = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    firebaseAuth.createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        resolve(user);
      })
      .catch((error) => {
        reject(error);
      });
  })
}

// Function to sign in with email and password
export const signIn = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    firebaseAuth.signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        resolve(user);
      })
      .catch((error) => {
        reject(error);
      });
  })
}

// Function to sign out
export const signOut = () => firebaseAuth.signOut(auth);

// Function to get the current user
export const getCurrentUser = () => firebaseAuth.getAuth(auth).currentUser;

// Function to register a callback for auth state changes
export const onAuthStateChanged = (callback) => {
  return firebaseAuth.onAuthStateChanged(auth, callback);
}

// Export firestore database
export const firestoreDb = getFirestore(app);
