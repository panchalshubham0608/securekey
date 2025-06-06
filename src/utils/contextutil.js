import { decrypt, encrypt } from "./cryptoutil";
import { generateStrongPassword } from "./passwordutil";

// only hashed passwords are stored
const appSecurityKey = generateStrongPassword(32);

// create a user object for context
// where user's password is encrypted
export const createUserForContext = ({ username, password }) => {
  let ciphertext = encrypt({ plaintext: password, key: appSecurityKey });
  return { username, password: ciphertext };
};

// fetch the user object from context
export const getUserFromContext = ({ username, password }) => {
  let plaintext = decrypt({ ciphertext: password, key: appSecurityKey });
  return { username, password: plaintext };
};
