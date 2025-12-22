import { clearStorage, saveMEKToDevice } from "./mek";
import { signIn } from "./signIn";
import { unlockVault } from "./vault";

// A secure sign-in does two things:
// 1. Authenticate the user's email/password for login.
// 2. Once authenticated, retrieves the MEK (Master Encryption Key) from the vault
export const secureSignIn = async ({ email, password, rememberDevice }) => {
  const { user } = await signIn({ email, password });

  const mek = await unlockVault({ user, password });
  clearStorage();
  if (rememberDevice) {
    await saveMEKToDevice({ mek });
  }

  return { user, mek };
};
