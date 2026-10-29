// imports
import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const rawFirebaseConfig = process.env.REACT_APP_FIREBASE_CONFIG;
const firebaseConfig =
  rawFirebaseConfig && rawFirebaseConfig !== "undefined"
    ? JSON.parse(rawFirebaseConfig)
    : null;

// Initialize Firebase
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? firebaseAuth.getAuth(app) : null;

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

// Export firestore database
export const firestoreDb = app ? getFirestore(app) : null;
