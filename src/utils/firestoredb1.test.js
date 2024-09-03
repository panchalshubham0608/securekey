import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { getUserFromContext } from "./contextutil";
import { validateUserContext } from "./contextvalidator";
import { decrypt, encrypt } from "./cryptoutil";

// Mock Firestore functions
jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

// Mock utility functions
jest.mock("./contextutil", () => ({
  getUserFromContext: jest.fn(),
}));

jest.mock("./contextvalidator", () => ({
  validateUserContext: jest.fn(),
}));

jest.mock("./cryptoutil", () => ({
  decrypt: jest.fn(),
  encrypt: jest.fn(),
}));

jest.mock("./firebase", () => ({
  firestoreDb: {},
}));

// Import the module after mocks are set up
let firestoreFunctions;

beforeAll(() => {
  // Import the module after mocks are set up
  collection.mockReturnValue("testCollection");
  firestoreFunctions = require("./firestoredb");
});

describe("Firestore Functions", () => {
  const whereOwnerMock = "whereOwnerMock";
  const whereAccountMock = "whereAccountMock";
  const whereUsernameMock = "whereUsernameMock";
  const limitMock = "limitMock";
  let env;

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    env = process.env;
    process.env.REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME = "testkeys";
    query.mockImplementation(() => "testQuery");
    where.mockImplementation((field, operator) => {
      if (operator !== "==") {
        throw new Error("Invalid operator");
      }
      switch (field) {
        case "owner": return whereOwnerMock;
        case "account": return whereAccountMock;
        case "username": return whereUsernameMock;
        default: throw new Error("Invalid field");
      }
    });
    limit.mockImplementation(() => limitMock);
  });

  afterEach(() => {
    process.env = env;
  });

  describe("getPassKeys", () => {
    test("successfully retrieves passkeys without password(s)", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockDocs = [
        { id: "1", data: () => ({ account: "testaccount1", username: "testusername1", password: "password1", history: ["oldpassword"] }) },
        { id: "2", data: () => ({ account: "testaccount2", username: "testusername2", password: "password2" }) },
      ];

      validateUserContext.mockResolvedValue(mockUserContext);
      getDocs.mockResolvedValue({ docs: mockDocs });

      const result = await firestoreFunctions.getPassKeys({ userContext: mockUserContext });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(where).toHaveBeenCalledWith("owner", "==", mockUserContext.user.username);
      expect(query).toHaveBeenCalledWith("testCollection", whereOwnerMock);
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(result).toEqual([
        { id: "1", account: "testaccount1", username: "testusername1" },
        { id: "2", account: "testaccount2", username: "testusername2" },
      ]);
    });

    test("handles validation error", async () => {
      const mockUserContext = {};
      const mockError = new Error("Validation Error");
      validateUserContext.mockRejectedValue(mockError);

      await expect(firestoreFunctions.getPassKeys({ userContext: mockUserContext })).rejects.toEqual({
        message: "Error validating user context",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getDocs).not.toHaveBeenCalled();
      expect(query).not.toHaveBeenCalled();
    });

    test("handles Firestore error", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      validateUserContext.mockResolvedValue(mockUserContext);
      const mockError = new Error("Firestore Error");
      getDocs.mockRejectedValue(mockError);

      await expect(firestoreFunctions.getPassKeys({ userContext: mockUserContext })).rejects.toEqual({
        message: "Error getting documents from Firestore",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(where).toHaveBeenCalledWith("owner", "==", mockUserContext.user.username);
      expect(query).toHaveBeenCalledWith("testCollection", whereOwnerMock);
      expect(getDocs).toHaveBeenCalledWith("testQuery");
    });
  });

  describe("getPassKeyValue", () => {
    test("successfully retrieves passkey value", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockDocs = [
        { id: "1", data: () => ({ account: "testaccount", username: "testusername", password: "encryptedpassword" }) },
      ];
      const mockSecretKey = "secretkey";
      const mockDecryptedPassword = "decryptedpassword";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      decrypt.mockReturnValue(mockDecryptedPassword);
      getDocs.mockResolvedValue({ docs: mockDocs });

      const result = await firestoreFunctions.getPassKeyValue({
        userContext: mockUserContext,
        account: "testaccount",
        username: "testusername",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(where).toHaveBeenCalledWith("owner", "==", mockUserContext.user.username);
      expect(where).toHaveBeenCalledWith("account", "==", "testaccount");
      expect(where).toHaveBeenCalledWith("username", "==", "testusername");
      expect(limit).toHaveBeenCalledWith(1);
      expect(query).toHaveBeenCalledWith(
        "testCollection",
        whereOwnerMock,
        whereAccountMock,
        whereUsernameMock,
        limitMock,
      );
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(decrypt).toHaveBeenCalledWith({ ciphertext: "encryptedpassword", key: mockSecretKey });
      expect(result).toEqual(mockDecryptedPassword);
    });

    test("handles validation error", async () => {
      const mockUserContext = {};
      const mockError = new Error("Validation Error");
      validateUserContext.mockRejectedValue(mockError);

      await expect(firestoreFunctions.getPassKeyValue({
        userContext: mockUserContext,
        account: "testaccount",
        username: "testusername",
      })).rejects.toEqual({
        message: "Error validating user context",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getDocs).not.toHaveBeenCalled();
      expect(query).not.toHaveBeenCalled();
      expect(getUserFromContext).not.toHaveBeenCalled();
      expect(decrypt).not.toHaveBeenCalled();
    });

    test("handles Firestore error", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      validateUserContext.mockResolvedValue(mockUserContext);
      const mockError = new Error("Firestore Error");
      getDocs.mockRejectedValue(mockError);

      await expect(firestoreFunctions.getPassKeyValue({
        userContext: mockUserContext,
        account: "testaccount",
        username: "testusername",
      })).rejects.toEqual({
        message: "Error getting documents from Firestore",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(where).toHaveBeenCalledWith("owner", "==", mockUserContext.user.username);
      expect(where).toHaveBeenCalledWith("account", "==", "testaccount");
      expect(where).toHaveBeenCalledWith("username", "==", "testusername");
      expect(limit).toHaveBeenCalledWith(1);
      expect(query).toHaveBeenCalledWith(
        "testCollection",
        whereOwnerMock,
        whereAccountMock,
        whereUsernameMock,
        limitMock,
      );
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(getUserFromContext).not.toHaveBeenCalled();
      expect(decrypt).not.toHaveBeenCalled();
    });

    test("handles decryption error", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockDocs = [
        { id: "1", data: () => ({ account: "testaccount", username: "testusername", password: "encryptedpassword" }) },
      ];
      const mockSecretKey = "secretkey";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      decrypt.mockImplementation(() => { throw new Error("Decryption Error"); });
      getDocs.mockResolvedValue({ docs: mockDocs });

      await expect(firestoreFunctions.getPassKeyValue({
        userContext: mockUserContext,
        account: "testaccount",
        username: "testusername",
      })).rejects.toEqual({
        message: "Error decrypting passkey",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(where).toHaveBeenCalledWith("owner", "==", mockUserContext.user.username);
      expect(where).toHaveBeenCalledWith("account", "==", "testaccount");
      expect(where).toHaveBeenCalledWith("username", "==", "testusername");
      expect(limit).toHaveBeenCalledWith(1);
      expect(query).toHaveBeenCalledWith(
        "testCollection",
        whereOwnerMock,
        whereAccountMock,
        whereUsernameMock,
        limitMock,
      );
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(decrypt).toHaveBeenCalledWith({ ciphertext: "encryptedpassword", key: mockSecretKey });
    });

    test("handles passkey not found", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      validateUserContext.mockResolvedValue(mockUserContext);
      getDocs.mockResolvedValue({ docs: [], empty: true });

      await expect(firestoreFunctions.getPassKeyValue({
        userContext: mockUserContext,
        account: "testaccount",
        username: "testusername",
      })).rejects.toEqual({
        message: "Passkey not found",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(where).toHaveBeenCalledWith("owner", "==", mockUserContext.user.username);
      expect(where).toHaveBeenCalledWith("account", "==", "testaccount");
      expect(where).toHaveBeenCalledWith("username", "==", "testusername");
      expect(limit).toHaveBeenCalledWith(1);
      expect(query).toHaveBeenCalledWith(
        "testCollection",
        whereOwnerMock,
        whereAccountMock,
        whereUsernameMock,
        limitMock,
      );
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(decrypt).not.toHaveBeenCalled();
      expect(getUserFromContext).not.toHaveBeenCalled();
    });
  });

  describe("addPassKey", () => {
    test("successfully adds a new passkey", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";
      const mockEncryptedPassword = "encryptedpassword";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockReturnValue(mockEncryptedPassword);
      getDocs.mockResolvedValue({ empty: true });
      addDoc.mockResolvedValue();

      await firestoreFunctions.addPassKey({
        userContext: mockUserContext,
        account: "testaccount",
        username: "testusername",
        password: "plaintextpassword",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(where).toHaveBeenCalledWith("owner", "==", mockUserContext.user.username);
      expect(where).toHaveBeenCalledWith("account", "==", "testaccount");
      expect(where).toHaveBeenCalledWith("username", "==", "testusername");
      expect(limit).toHaveBeenCalledWith(1);
      expect(query).toHaveBeenCalledWith(
        "testCollection",
        whereOwnerMock,
        whereAccountMock,
        whereUsernameMock,
        limitMock,
      );
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(addDoc).toHaveBeenCalledWith("testCollection", {
        owner: mockUserContext.user.username,
        account: "testaccount",
        username: "testusername",
        password: mockEncryptedPassword,
        history: [],
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      });
    });

    test("throws error when context validation fails", async () => {
      const mockUserContext = { user: {} };
      validateUserContext.mockRejectedValue(new Error("Validation Error"));

      await expect(
        firestoreFunctions.addPassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error validating user context" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getDocs).not.toHaveBeenCalled();
      expect(addDoc).not.toHaveBeenCalled();
    });

    test("throws error when getting user from context fails", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockImplementation(() => {
        throw new Error("Error");
      });

      await expect(
        firestoreFunctions.addPassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error decoding user context" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(getDocs).not.toHaveBeenCalled();
      expect(addDoc).not.toHaveBeenCalled();
    });

    test("throws error when encryption fails", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockImplementation(() => {
        throw new Error("Encryption error");
      });

      await expect(
        firestoreFunctions.addPassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error encrypting passkey" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(getDocs).not.toHaveBeenCalled();
      expect(addDoc).not.toHaveBeenCalled();
    });

    test("throws error if retreiving firestore documents fails", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";
      const mockEncryptedPassword = "encryptedpassword";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockReturnValue(mockEncryptedPassword);
      getDocs.mockRejectedValue(new Error("Firestore error"));

      await expect(
        firestoreFunctions.addPassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error getting documents from Firestore" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(addDoc).not.toHaveBeenCalled();
    });

    test("throws error when passkey already exists", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";
      const mockEncryptedPassword = "encryptedpassword";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockReturnValue(mockEncryptedPassword);
      getDocs.mockResolvedValue({ empty: false });

      await expect(
        firestoreFunctions.addPassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Passkey already exists" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(addDoc).not.toHaveBeenCalled();
    });

    test("throws error when saving passkey fails", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";
      const mockEncryptedPassword = "encryptedpassword";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockReturnValue(mockEncryptedPassword);
      getDocs.mockResolvedValue({ empty: true });
      addDoc.mockRejectedValue(new Error("Firestore save failed"));

      await expect(
        firestoreFunctions.addPassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error saving passkey to Firestore" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(addDoc).toHaveBeenCalledWith("testCollection", {
        owner: mockUserContext.user.username,
        account: "testaccount",
        username: "testusername",
        password: mockEncryptedPassword,
        history: [],
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      });
    });
  });


  describe("updatePassKey", () => {
    test.each([
      [{ history: [] }],
      [{
        history: [
          { password: "password1", changedAt: Date.now() },
          { password: "password2", changedAt: Date.now() },
        ]
      }]
    ])("successfully updates an existing passkey and preserve history", async (args) => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";
      const mockEncryptedPassword = "encryptedpassword";
      const history = args.history;
      const mockDocs = [
        {
          id: "1",
          data: function () {
            return {
              account: "testaccount", username: "testusername", password: "oldpassword", history
            }
          },
          ref: "doc1Ref",
        },
      ];

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockReturnValue(mockEncryptedPassword);
      getDocs.mockResolvedValue({
        docs: mockDocs,
        empty: false,
      });
      updateDoc.mockResolvedValue();

      await firestoreFunctions.updatePassKey({
        userContext: mockUserContext,
        account: "testaccount",
        username: "testusername",
        password: "plaintextpassword",
      });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(where).toHaveBeenCalledWith("owner", "==", mockUserContext.user.username);
      expect(where).toHaveBeenCalledWith("account", "==", "testaccount");
      expect(where).toHaveBeenCalledWith("username", "==", "testusername");
      expect(limit).toHaveBeenCalledWith(1);
      expect(query).toHaveBeenCalledWith(
        "testCollection",
        whereOwnerMock,
        whereAccountMock,
        whereUsernameMock,
        limitMock,
      );
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(updateDoc).toHaveBeenCalledWith("doc1Ref", {
        password: mockEncryptedPassword,
        history: [
          ...history,
          { password: "oldpassword", changedAt: expect.any(Number) },
        ],
        updatedAt: expect.any(Number),
      });
    });

    test("throws error when context validation fails", async () => {
      const mockUserContext = { user: {} };
      validateUserContext.mockRejectedValue(new Error("Validation Error"));

      await expect(
        firestoreFunctions.updatePassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error validating user context" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getDocs).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test("throws error when getting user from context fails", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockImplementation(() => {
        throw new Error("Error");
      });

      await expect(
        firestoreFunctions.updatePassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error decoding user context" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(getDocs).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test("throws error when encryption fails", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockImplementation(() => {
        throw new Error("Encryption error");
      });

      await expect(
        firestoreFunctions.updatePassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error encrypting passkey" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(getDocs).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test("throws error if retreiving firestore documents fails", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";
      const mockEncryptedPassword = "encryptedpassword";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockReturnValue(mockEncryptedPassword);
      getDocs.mockRejectedValue(new Error("Firestore error"));

      await expect(
        firestoreFunctions.updatePassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error getting documents from Firestore" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test("throws error when passkey does not exists", async () => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";
      const mockEncryptedPassword = "encryptedpassword";

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockReturnValue(mockEncryptedPassword);
      getDocs.mockResolvedValue({ empty: true });

      await expect(
        firestoreFunctions.updatePassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Passkey not found" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test.each([
      [{ history: [] }],
      [{
        history: [
          { password: "password1", changedAt: Date.now() },
          { password: "password2", changedAt: Date.now() },
        ]
      }]
    ])("throws error when updating passkey fails", async (args) => {
      const mockUserContext = { user: { username: "testuser" } };
      const mockSecretKey = "secretkey";
      const mockEncryptedPassword = "encryptedpassword";
      const history = args.history;
      const mockDocs = [
        {
          id: "1",
          data: function () {
            return {
              account: "testaccount", username: "testusername", password: "oldpassword", history
            }
          },
          ref: "doc1Ref",
        },
      ];

      validateUserContext.mockResolvedValue(mockUserContext);
      getUserFromContext.mockReturnValue({ password: mockSecretKey });
      encrypt.mockReturnValue(mockEncryptedPassword);
      getDocs.mockResolvedValue({ docs: mockDocs, empty: false });
      updateDoc.mockRejectedValue(new Error("Firestore update failed"));

      await expect(
        firestoreFunctions.updatePassKey({
          userContext: mockUserContext,
          account: "testaccount",
          username: "testusername",
          password: "plaintextpassword",
        })
      ).rejects.toEqual({ message: "Error updating passkey in Firestore" });

      expect(validateUserContext).toHaveBeenCalledWith(mockUserContext);
      expect(getUserFromContext).toHaveBeenCalledWith(mockUserContext.user);
      expect(getDocs).toHaveBeenCalledWith("testQuery");
      expect(encrypt).toHaveBeenCalledWith({ plaintext: "plaintextpassword", key: mockSecretKey });
      expect(updateDoc).toHaveBeenCalledWith("doc1Ref", {
        password: mockEncryptedPassword,
        history: [
          ...history,
          { password: "oldpassword", changedAt: expect.any(Number) },
        ],
        updatedAt: expect.any(Number),
      });
    });
  });
});
