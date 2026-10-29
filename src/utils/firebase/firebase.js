// imports
import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Parse web app's Firebase configuration safely when .env is not configured
const rawFirebaseConfig = process.env.REACT_APP_FIREBASE_CONFIG;
let firebaseConfig = null;
if (rawFirebaseConfig && rawFirebaseConfig !== "undefined") {
  try {
    firebaseConfig = JSON.parse(rawFirebaseConfig);
  } catch (err) {
    firebaseConfig = null;
  }
}

// Initialize Firebase if valid config is present
let app = null;
let authInstance = null;
let dbInstance = null;

if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
  try {
    app = initializeApp(firebaseConfig);
    authInstance = firebaseAuth.getAuth(app);
    dbInstance = getFirestore(app);
  } catch (err) {
    authInstance = null;
    dbInstance = null;
  }
}

export const isFirebaseConfigured = Boolean(authInstance && dbInstance);
export const auth = authInstance;
export const db = dbInstance;

