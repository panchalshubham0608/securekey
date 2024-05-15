// imports
import sha256 from "crypto-js/sha256";

// utility function to generate color of account
const str2color = (string) => {
  // Hash the input string
  let hash = sha256(string);
  // Extract the last 6 characters of the hash
  let hex = hash.toString().slice(-6);
  // return the color in hex format
  return `#${hex}`;
};

export { str2color };
