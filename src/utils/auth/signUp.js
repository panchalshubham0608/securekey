import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

export const signUp = async ({ email, password }) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
};
