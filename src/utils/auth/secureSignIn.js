import { auth } from "../firebase/firebase";
import { signIn } from "./signIn";
import { unlockVault } from "./vault";

// A secure sign-in does two things:
// 1. Authenticate the user's email/password for login.
// 2. Once authenticated, retrieves the MEK (Master Encryption Key) from the vault
export const secureSignIn = async ({ email, password }) => {
  if (!auth) {
    const demoUser = { uid: "local-demo-user", email };
    const demoMek = new Uint8Array(32);
    return { user: demoUser, mek: demoMek };
  }

  const { user } = await signIn({ email, password });

  const mek = await unlockVault({ user, password });

  return { user, mek };
};

