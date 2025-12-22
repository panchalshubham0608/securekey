import { signUp } from "./signUp";
import { initializeVault } from "./vault";

// A secure signup does two things:
// 1. Create Firebase user
// 2. Initialize encrypted vault
export const secureSignUp = async ({ email, password }) => {
  const user = await signUp({ email, password });

  const mek = await initializeVault({
    uid: user.uid,
    password
  });

  return {
    user,
    mek
  };
};
