// imports
import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
if (!process.env.REACT_APP_FIREBASE_CONFIG) {
  throw new Error("Firebase configuration is missing.");
}

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

// Setup recapctha verifier
export const setUpRecaptchaVerifier = () => {
  return new Promise((resolve, reject) => {
    try {
      window.recaptchaVerifier = new firebaseAuth.RecaptchaVerifier(auth, "recaptcha-container", {
        "size": "invisible",
        "callback": (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log(response);
        },
        "expired-callback": () => {
  
        }
      });
      resolve();
    } catch (error) {
      reject(error);
    }  
  });
};

// Function to request for 2FA with phone number
export const request2FACodeWithPhoneNumber = ({user, phoneNumber, appVerifier}) => {
  return new Promise((resolve, reject) => {
    const multiFactorUser = firebaseAuth.multiFactor(user);
    multiFactorUser.getSession().then(session => {
      const phoneAuthProvider = new firebaseAuth.PhoneAuthProvider();
      phoneAuthProvider.verifyPhoneNumber({ phoneNumber, session}, appVerifier).then(verificationId => {
        resolve(verificationId);
      }).catch(error => reject(error));
    }).catch(error => reject(error));
  });
};

// Function to add phone number for 2-factor authentication
export const addPhoneNumberFor2FA = ({user, phoneNumber, appVerifier, verificationCode}) => {
  return new Promise((resolve, reject) => {
    const multiFactorUser = firebaseAuth.multiFactor(user);
    multiFactorUser.getSession().then(session => {
      const phoneAuthProvider = new firebaseAuth.PhoneAuthProvider();
      phoneAuthProvider.verifyPhoneNumber({ phoneNumber, session}, appVerifier).then(verificationId => {
        const phoneCredential = firebaseAuth.PhoneAuthProvider.credential(verificationId, verificationCode);
        multiFactorUser.enroll(phoneCredential, "Your display name");
        resolve();
      })
    }).catch(error => reject(error));
  });
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

// Function to check if multi-factor is enrolled
export const isMultiFactorEnrollmentEnabled = (user) => {
  const multiFactorUser = firebaseAuth.multiFactor(user);
  const enrolledFactors = multiFactorUser.enrolledFactors;
  return enrolledFactors.length > 0;
};

// Function to sign out
export const signOut = () => firebaseAuth.signOut(auth);

// Function to get the current user
export const getCurrentUser = () => firebaseAuth.getAuth(auth).currentUser;

// Export firestore database
export const firestoreDb = getFirestore(app);
