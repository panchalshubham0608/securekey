// Function to generate a strong password
export const generateStrongPassword = (length = 16) => {
  // Define the characters to use for generating the password
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

  // Use Web Crypto CSPRNG when available for cryptographic randomness
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);
    let password = "";
    for (let i = 0; i < length; i++) {
      password += characters.charAt(randomValues[i] % characters.length);
    }
    return password;
  }

  // Fallback for environments without window.crypto
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return password;
};

// Evaluate password strength for real-time UI feedback
export const evaluatePasswordStrength = (password) => {
  if (!password) {
    return { score: 0, label: "Enter a password", level: "empty", percent: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score: 1, label: "Weak", level: "weak", percent: 25 };
  }
  if (score === 2) {
    return { score: 2, label: "Fair", level: "fair", percent: 50 };
  }
  if (score === 3 || score === 4) {
    return { score: 3, label: "Good", level: "good", percent: 75 };
  }
  return { score: 4, label: "Vault-Grade", level: "strong", percent: 100 };
};
