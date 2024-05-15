// imports
import CryptoJS from "crypto-js";

// methods for encryption and decryption
export const encrypt = ({plaintext, key}) => CryptoJS.AES.encrypt(plaintext, key).toString();
export const decrypt = ({ciphertext, key}) => CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
