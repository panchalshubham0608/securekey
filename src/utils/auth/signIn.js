import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

export const signIn = async ({ email, password }) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return {
    user: userCredential.user,
    password // ONLY returned, never stored globally
  };
};
