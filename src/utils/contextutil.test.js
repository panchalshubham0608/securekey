const strongPassword = "strongpassword";
jest.mock("./passwordutil", () => ({
  generateStrongPassword: jest.fn().mockReturnValue(strongPassword),
}));

jest.mock("./cryptoutil");


describe("createUserForContext", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("encrypts context password", () => {
    const { generateStrongPassword } = require("./passwordutil");
    const strongPassword = "strongpassword";
    const { encrypt } = require("./cryptoutil");
    const hashedPassword = "encryptedpassword";
    encrypt.mockReturnValue(hashedPassword);

    const { createUserForContext } = require("./contextutil");
    const originalContext = { username: "user", password: "password" };
    const actualContext = createUserForContext(originalContext);

    expect(actualContext.username).toBe(originalContext.username);
    expect(actualContext.password).toBe(hashedPassword);
    expect(generateStrongPassword).toHaveBeenCalledWith(32);
    expect(encrypt).toHaveBeenCalledWith({ plaintext: originalContext.password, key: strongPassword });
  });

  test("throws error if encrypt fails", () => {
    const { generateStrongPassword } = require("./passwordutil");
    const strongPassword = "strongpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockImplementation(() => {
      throw new Error("encrypt failed");
    });

    const { createUserForContext } = require("./contextutil");
    const originalContext = { username: "user", password: "password" };
    expect(() => {
      createUserForContext(originalContext);
    }).toThrow("encrypt failed");

    expect(generateStrongPassword).toHaveBeenCalledWith(32);
    expect(encrypt).toHaveBeenCalledWith({ plaintext: originalContext.password, key: strongPassword });
  });
});

describe("getUserFromContext", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("decrypts context password", () => {
    const { generateStrongPassword } = require("./passwordutil");
    const strongPassword = "strongpassword";
    const { decrypt } = require("./cryptoutil");
    const decryptedPassword = "decryptedpassword";
    decrypt.mockReturnValue(decryptedPassword);

    const { getUserFromContext } = require("./contextutil");
    const originalContext = { username: "user", password: "encryptedpassword" };
    const actualContext = getUserFromContext(originalContext);

    expect(actualContext.username).toBe(originalContext.username);
    expect(actualContext.password).toBe(decryptedPassword);
    expect(generateStrongPassword).toHaveBeenCalledWith(32);
    expect(decrypt).toHaveBeenCalledWith({ ciphertext: originalContext.password, key: strongPassword });
  });

  test("throws error if decrypt fails", () => {
    const { generateStrongPassword } = require("./passwordutil");
    const strongPassword = "strongpassword";
    const { decrypt } = require("./cryptoutil");
    decrypt.mockImplementation(() => {
      throw new Error("decrypt failed");
    });

    const { getUserFromContext } = require("./contextutil");
    const originalContext = { username: "user", password: "encryptedpassword" };
    expect(() => {
      getUserFromContext(originalContext);
    }).toThrow("decrypt failed");

    expect(generateStrongPassword).toHaveBeenCalledWith(32);
    expect(decrypt).toHaveBeenCalledWith({ ciphertext: originalContext.password, key: strongPassword });
  });
});
