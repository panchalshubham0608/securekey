// Import modules
const { generateStrongPassword } = require("./passwordutil");
const { encrypt, decrypt } = require("./cryptoutil");
const { createUserForContext, getUserFromContext } = require("./contextutil");

// Mock implementations
const strongPassword = "strongpassword";
const hashedPassword = "encryptedpassword";
const decryptedPassword = "decryptedpassword";

// Mocks
jest.mock("./passwordutil", () => ({
  generateStrongPassword: jest.fn().mockReturnValue(strongPassword),
}));

jest.mock("./cryptoutil", () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));

describe("generates security key on load", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  test("should correctly generate api key for hashing", () => {
    const { generateStrongPassword } = require("./passwordutil");
    require("./contextutil");
    expect(generateStrongPassword).toHaveBeenCalledWith(32);
  });
});

describe("createUserForContext", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks to ensure clean state for each test
  });

  test("encrypts context password", () => {
    encrypt.mockReturnValue(hashedPassword);

    const originalContext = { username: "user", password: "password" };
    const actualContext = createUserForContext(originalContext);

    expect(actualContext.username).toBe(originalContext.username);
    expect(actualContext.password).toBe(hashedPassword);
    expect(encrypt).toHaveBeenCalledWith({ plaintext: originalContext.password, key: strongPassword });
  });

  test("throws error if encrypt fails", () => {
    encrypt.mockImplementation(() => {
      throw new Error("encrypt failed");
    });

    const originalContext = { username: "user", password: "password" };
    expect(() => {
      createUserForContext(originalContext);
    }).toThrow("encrypt failed");

    expect(encrypt).toHaveBeenCalledWith({ plaintext: originalContext.password, key: strongPassword });
  });
});

describe("getUserFromContext", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks to ensure clean state for each test
  });

  test("decrypts context password", () => {
    decrypt.mockReturnValue(decryptedPassword);

    const originalContext = { username: "user", password: hashedPassword };
    const actualContext = getUserFromContext(originalContext);

    expect(actualContext.username).toBe(originalContext.username);
    expect(actualContext.password).toBe(decryptedPassword);
    expect(decrypt).toHaveBeenCalledWith({ ciphertext: originalContext.password, key: strongPassword });
  });

  test("throws error if decrypt fails", () => {
    decrypt.mockImplementation(() => {
      throw new Error("decrypt failed");
    });

    const originalContext = { username: "user", password: hashedPassword };
    expect(() => {
      getUserFromContext(originalContext);
    }).toThrow("decrypt failed");

    expect(decrypt).toHaveBeenCalledWith({ ciphertext: originalContext.password, key: strongPassword });
  });
});
