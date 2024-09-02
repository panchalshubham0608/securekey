jest.mock("./cryptoutil");
jest.mock("./contextutil");

// To enforce, ordering of where clauses, we need to mock the firestore module
const mockWhereOwner = "whereOwner";
const mockWhereAccount = "whereAccount";
const mockWhereUsername = "whereUsername";
function mockFirestore() {
  const mockWhereFunc = jest.fn((field, operator) => {
    if (operator !== "==") {
      throw new Error("Invalid operator");
    }
    if (field === "owner") {
      return mockWhereOwner;
    }
    if (field === "account") {
      return mockWhereAccount;
    }
    if (field === "username") {
      return mockWhereUsername;
    }
  });

  jest.mock("firebase/firestore", () => {
    return {
      collection: jest.fn(),
      query: jest.fn(),
      where: mockWhereFunc,
      limit: jest.fn(),
      getDocs: jest.fn(),
      addDoc: jest.fn(),
      updateDoc: jest.fn(),
      deleteDoc: jest.fn(),
    };
  });
}

const mockFirestoreDb = { x: 1, y: 2 };
const mockCollection = jest.fn();
jest.mock("./firebase", () => {
  return {
    firestoreDb: mockFirestoreDb,
  };
});

describe("firestoredb", () => {
  let env = process.env;
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    mockFirestore();
    process.env = {
      ...env,
      REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME: "testkeys",
    };
  });
  afterEach(() => {
    process.env = env;
  });

  test("keys-collection is initialized", () => {
    const { collection } = require("firebase/firestore");
    collection.mockReturnValue(mockCollection);
    require("./firestoredb");
    expect(collection).toHaveBeenCalledWith(
      mockFirestoreDb,
      process.env.REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME
    );
  });
});

// Return a list of user contexts for testing
function getInvalidUserContexts() {
  return [
    null,
    {},
    { user: null },
    { user: {} },
    { user: { username: null } },
    { user: { username: "testuser" } },
    { user: { username: "testuser", password: null } },
  ];
}

describe("getPassKeys", () => {
  let env = process.env;
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    mockFirestore();
    process.env = {
      ...env,
      REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME: "testkeys",
    };
  });
  afterEach(() => {
    process.env = env;
  });

  test("throws error for invalid user context", async () => {
    const {
      getPassKeys,
    } = require("./firestoredb");
    const invalidUserContexts = getInvalidUserContexts();
    for (let userContext of invalidUserContexts) {
      await expect(getPassKeys({ userContext })).rejects.toEqual({
        message: "Error validating user context",
      });
    }
  });

  test("retrieves keys", async () => {
    const { collection, query, where, getDocs } = require("firebase/firestore");
    collection.mockReturnValue(mockCollection);

    const { getPassKeys } = require("./firestoredb");
    const userContext = {
      user: { username: "testuser", password: "testpassword" },
    };

    const mockQuery = "query";
    query.mockReturnValue(mockQuery);

    let querySnapshot = {
      docs: [
        {
          id: 1,
          data: () => ({
            account: "testaccount",
            username: "testusername",
            password: "testpassword",
          }),
        },
        {
          id: 2,
          data: () => ({
            account: "testaccount2",
            username: "testusername2",
            password: "testpassword2",
          }),
        },
      ],
    };
    getDocs.mockResolvedValue(querySnapshot);

    let keys = await getPassKeys({ userContext });

    expect(where).toHaveBeenCalledWith(
      "owner",
      "==",
      userContext.user.username
    );
    expect(query).toHaveBeenCalledWith(mockCollection, mockWhereOwner);
    expect(getDocs).toHaveBeenCalledWith(mockQuery);

    expect(keys).toEqual([
      { id: 1, account: "testaccount", username: "testusername" },
      { id: 2, account: "testaccount2", username: "testusername2" },
    ]);
  });

  test("deletes password and history", async () => {
    const { collection, query, where, getDocs } = require("firebase/firestore");
    collection.mockReturnValue(mockCollection);

    const { getPassKeys } = require("./firestoredb");
    const userContext = {
      user: { username: "testuser", password: "testpassword" },
    };

    const mockQuery = "query";
    query.mockReturnValue(mockQuery);

    let querySnapshot = {
      docs: [
        {
          id: 1,
          data: () => ({
            account: "testaccount",
            username: "testusername",
            password: "testpassword",
          }),
        },
        {
          id: 2,
          data: () => ({
            account: "testaccount2",
            username: "testusername2",
            password: "testpassword2",
            history: ["password1"],
          }),
        },
      ],
    };
    getDocs.mockResolvedValue(querySnapshot);

    let keys = await getPassKeys({ userContext });

    expect(where).toHaveBeenCalledWith(
      "owner",
      "==",
      userContext.user.username
    );
    expect(query).toHaveBeenCalledWith(mockCollection, mockWhereOwner);
    expect(getDocs).toHaveBeenCalledWith(mockQuery);

    expect(keys).toEqual([
      { id: 1, account: "testaccount", username: "testusername" },
      { id: 2, account: "testaccount2", username: "testusername2" },
    ]);
  });

  test("handles error", async () => {
    const { getPassKeys } = require("./firestoredb");
    const userContext = {
      user: { username: "testuser", password: "testpassword" },
    };

    const { getDocs } = require("firebase/firestore");
    getDocs.mockRejectedValue("error");

    await expect(getPassKeys({ userContext })).rejects.toEqual({
      message: "Error getting documents from Firestore",
    });
    expect(getDocs).toHaveBeenCalled();
  });
});

describe("getPassKeyValue", () => {
  let env = process.env;
  const mockQuery = "query";
  const mockLimit = "limit";

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    mockFirestore();
    process.env = {
      ...env,
      REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME: "testkeys",
    };

    const { collection, query, limit } = require("firebase/firestore");
    collection.mockReturnValue(mockCollection);
    query.mockReturnValue(mockQuery);
    limit.mockReturnValue(mockLimit);
  });
  afterEach(() => {
    process.env = env;
  });

  function verifyArgs({ userContext, account, username }) {
    const { query, where, limit, getDocs } = require("firebase/firestore");
    expect(where).toHaveBeenCalledWith(
      "owner",
      "==",
      userContext.user.username
    );
    expect(where).toHaveBeenCalledWith("account", "==", account);
    expect(where).toHaveBeenCalledWith("username", "==", username);
    expect(query).toHaveBeenCalledWith(
      mockCollection,
      mockWhereOwner,
      mockWhereAccount,
      mockWhereUsername,
      mockLimit
    );
    expect(limit).toHaveBeenCalledWith(1);
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
  }

  test("throws error for invalid user context", async () => {
    const { getPassKeyValue } = require("./firestoredb");
    const invalidUserContexts = getInvalidUserContexts();
    for (let userContext of invalidUserContexts) {
      await expect(getPassKeyValue({ userContext })).rejects.toEqual({
        message: "Error validating user context",
      });
    }
  });

  test("retrieves key value", async () => {
    // setup mocks for decrypt and getUserFromContext
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { decrypt } = require("./cryptoutil");
    const { getUserFromContext } = require("./contextutil");
    const decodedKey = "decodedKey";
    getUserFromContext.mockReturnValue({ password: decodedKey });
    let userDecodedPassword = "userplaintextpassword";
    decrypt.mockReturnValue(userDecodedPassword);

    // setup mock response for getDocs
    const { getDocs } = require("firebase/firestore");
    let data = {
      account: "testaccount",
      username: "testusername",
      password: "userpassword",
    };
    let querySnapshot = {
      docs: [
        { data: () => ({ ...data }) },
        // this should be ignored
        {
          data: () => ({
            account: "testaccount2",
            username: "testusername2",
            password: "userpassword2",
            history: ["oldpassword"],
          }),
        },
      ],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);

    // call getPassKeyValue
    const { getPassKeyValue } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    let password = await getPassKeyValue({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
    expect(getUserFromContext).toHaveBeenCalledWith(userContext.user);
    expect(decrypt).toHaveBeenCalledWith({
      ciphertext: data.password,
      key: decodedKey,
    });
    expect(password).toEqual(userDecodedPassword);
  });

  test("rejects if fails to decrypt", async () => {
    // setup mocks for decrypt and getUserFromContext
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { decrypt } = require("./cryptoutil");
    const { getUserFromContext } = require("./contextutil");
    const decodedKey = "decodedKey";
    getUserFromContext.mockReturnValue({ password: decodedKey });
    decrypt.mockImplementation(() => {
      throw new Error("decryption error");
    });

    // setup mock response for getDocs
    const { getDocs } = require("firebase/firestore");
    let data = {
      account: "testaccount",
      username: "testusername",
      password: "userpassword",
    };
    let querySnapshot = {
      docs: [{ data: () => ({ ...data }) }],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);

    // call getPassKeyValue
    const { getPassKeyValue } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(
      getPassKeyValue({
        userContext,
        account: requestData.account,
        username: requestData.username,
      })
    ).rejects.toEqual({ message: "Error decrypting passkey" });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
    expect(getUserFromContext).toHaveBeenCalledWith(userContext.user);
    expect(decrypt).toHaveBeenCalledWith({
      ciphertext: data.password,
      key: decodedKey,
    });
  });

  test("rejects if doc is not found", async () => {
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { getDocs } = require("firebase/firestore");
    let querySnapshot = {
      docs: [],
      empty: true,
    };
    getDocs.mockResolvedValue(querySnapshot);

    const { getPassKeyValue } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(
      getPassKeyValue({
        userContext,
        account: requestData.account,
        username: requestData.username,
      })
    ).rejects.toEqual({ message: "Passkey not found" });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects is fails to getDocs", async () => {
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { getDocs } = require("firebase/firestore");
    getDocs.mockRejectedValue("error");

    const { getPassKeyValue } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(
      getPassKeyValue({
        userContext,
        account: requestData.account,
        username: requestData.username,
      })
    ).rejects.toEqual({ message: "Error getting documents from Firestore" });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });
});

describe("addPassKey", () => {
  const env = process.env;
  const mockQuery = "query";
  const mockLimit = "limit";
  const userContext = {
    user: { username: "testuser", password: "testpassword" },
  };
  const userDecodedPassword = "userplaintextpassword";

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    mockFirestore();
    process.env = {
      ...env,
      REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME: "testkeys",
    };

    const { collection, query, limit } = require("firebase/firestore");
    collection.mockReturnValue(mockCollection);
    query.mockReturnValue(mockQuery);
    limit.mockReturnValue(mockLimit);

    const { getUserFromContext } = require("./contextutil");
    getUserFromContext.mockReturnValue({ password: userDecodedPassword });
  });
  afterEach(() => {
    process.env = env;
  });

  function verifyArgs({ userContext, account, username }) {
    const { query, where, limit } = require("firebase/firestore");
    const { getUserFromContext } = require("./contextutil");
    expect(where).toHaveBeenCalledWith(
      "owner",
      "==",
      userContext.user.username
    );
    expect(where).toHaveBeenCalledWith("account", "==", account);
    expect(where).toHaveBeenCalledWith("username", "==", username);
    expect(query).toHaveBeenCalledWith(
      mockCollection,
      mockWhereOwner,
      mockWhereAccount,
      mockWhereUsername,
      mockLimit
    );
    expect(limit).toHaveBeenCalledWith(1);
    expect(getUserFromContext).toHaveBeenCalledWith(userContext.user);
  }

  test("throws error for invalid user context", async () => {
    const { addPassKey } = require("./firestoredb");
    const invalidUserContexts = getInvalidUserContexts();
    for (let userContext of invalidUserContexts) {
      await expect(addPassKey({ userContext })).rejects.toEqual({
        message: "Error validating user context",
      });
    }
  });

  test("adds key", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, addDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [],
      empty: true,
    };
    getDocs.mockResolvedValue(querySnapshot);
    addDoc.mockResolvedValue({});

    const { addPassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await addPassKey({ userContext, ...requestData });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(addDoc).toHaveBeenCalledWith(mockCollection, {
      owner: userContext.user.username,
      ...requestData,
      password: ciphertext,
      history: [],
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if addDoc fails", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, addDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [],
      empty: true,
    };
    getDocs.mockResolvedValue(querySnapshot);
    addDoc.mockRejectedValue("error");

    const { addPassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await expect(addPassKey({ userContext, ...requestData })).rejects.toEqual({
      message: "Error saving passkey to Firestore",
    });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(addDoc).toHaveBeenCalledWith(mockCollection, {
      owner: userContext.user.username,
      ...requestData,
      password: ciphertext,
      history: [],
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if passkey already exists", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, addDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [
        {
          data: () => ({
            account: "requestAccount",
            username: "requestUsername",
          }),
        },
      ],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);

    const { addPassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await expect(addPassKey({ userContext, ...requestData })).rejects.toEqual({
      message: "Passkey already exists",
    });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(addDoc).not.toHaveBeenCalled();
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if getDocs fails", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, addDoc } = require("firebase/firestore");
    getDocs.mockRejectedValue("error");

    const { addPassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await expect(addPassKey({ userContext, ...requestData })).rejects.toEqual({
      message: "Error getting documents from Firestore",
    });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(addDoc).not.toHaveBeenCalled();
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if fails to encrypt", async () => {
    const { encrypt } = require("./cryptoutil");
    encrypt.mockImplementation(() => {
      throw new Error("encryption error");
    });

    const { getDocs, addDoc } = require("firebase/firestore");
    const { addPassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await expect(addPassKey({ userContext, ...requestData })).rejects.toEqual({
      message: "Error encrypting passkey",
    });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).not.toHaveBeenCalled();
    expect(addDoc).not.toHaveBeenCalled();
  });
});

describe("updatePassKey", () => {
  const env = process.env;
  const mockQuery = "query";
  const mockLimit = "limit";
  const userContext = {
    user: { username: "testuser", password: "testpassword" },
  };
  const userDecodedPassword = "userplaintextpassword";

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    mockFirestore();
    process.env = {
      ...env,
      REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME: "testkeys",
    };

    const { collection, query, limit } = require("firebase/firestore");
    collection.mockReturnValue(mockCollection);
    query.mockReturnValue(mockQuery);
    limit.mockReturnValue(mockLimit);

    const { getUserFromContext } = require("./contextutil");
    getUserFromContext.mockReturnValue({ password: userDecodedPassword });
  });
  afterEach(() => {
    process.env = env;
  });

  function verifyArgs({ userContext, account, username }) {
    const { query, where, limit } = require("firebase/firestore");
    const { getUserFromContext } = require("./contextutil");
    expect(where).toHaveBeenCalledWith(
      "owner",
      "==",
      userContext.user.username
    );
    expect(where).toHaveBeenCalledWith("account", "==", account);
    expect(where).toHaveBeenCalledWith("username", "==", username);
    expect(query).toHaveBeenCalledWith(
      mockCollection,
      mockWhereOwner,
      mockWhereAccount,
      mockWhereUsername,
      mockLimit
    );
    expect(limit).toHaveBeenCalledWith(1);
    expect(getUserFromContext).toHaveBeenCalledWith(userContext.user);
  }

  test("throws error for invalid user context", async () => {
    const { updatePassKey } = require("./firestoredb");
    const invalidUserContexts = getInvalidUserContexts();
    for (let userContext of invalidUserContexts) {
      await expect(updatePassKey({ userContext })).rejects.toEqual({
        message: "Error validating user context",
      });
    }
  });

  test("updates key", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, updateDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [
        {
          id: 1,
          ref: "ref",
          data: () => ({
            account: "testaccount",
            username: "testusername",
            password: "oldpassword",
          }),
        },
      ],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);
    updateDoc.mockResolvedValue({});

    const { updatePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await updatePassKey({ userContext, ...requestData });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(updateDoc).toHaveBeenCalledWith("ref", {
      password: ciphertext,
      history: [
        {
          password: "oldpassword",
          changedAt: expect.any(Number),
        },
      ],
      updatedAt: expect.any(Number),
    });
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("updates key with history", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, updateDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [
        {
          id: 1,
          ref: "ref",
          data: () => ({
            account: "testaccount",
            username: "testusername",
            password: "oldpassword",
            history: [{ password: "password1", changedAt: 1234 }],
          }),
        },
      ],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);
    updateDoc.mockResolvedValue({});

    const { updatePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await updatePassKey({ userContext, ...requestData });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(updateDoc).toHaveBeenCalledWith("ref", {
      password: ciphertext,
      updatedAt: expect.any(Number),
      history: [
        { password: "password1", changedAt: 1234 },
        { password: "oldpassword", changedAt: expect.any(Number) },
      ],
    });
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if updateDoc fails", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, updateDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [
        {
          id: 1,
          ref: "ref",
          data: () => ({
            account: "testaccount",
            username: "testusername",
            password: "oldpassword",
            history: [{ password: "testpassword", changedAt: 1234 }],
          }),
        },
      ],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);
    updateDoc.mockRejectedValue("error");

    const { updatePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await expect(
      updatePassKey({ userContext, ...requestData })
    ).rejects.toEqual({ message: "Error updating passkey in Firestore" });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(updateDoc).toHaveBeenCalledWith("ref", {
      password: ciphertext,
      updatedAt: expect.any(Number),
      history: [
        {
          password: "testpassword",
          changedAt: expect.any(Number),
        },
        {
          password: "oldpassword",
          changedAt: expect.any(Number),
        },
      ],
    });
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if passkey not found", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, updateDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [],
      empty: true,
    };
    getDocs.mockResolvedValue(querySnapshot);

    const { updatePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await expect(
      updatePassKey({ userContext, ...requestData })
    ).rejects.toEqual({ message: "Passkey not found" });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(updateDoc).not.toHaveBeenCalled();
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if getDocs fails", async () => {
    const ciphertext = "encryptedpassword";
    const { encrypt } = require("./cryptoutil");
    encrypt.mockReturnValue(ciphertext);

    const { getDocs, updateDoc } = require("firebase/firestore");
    getDocs.mockRejectedValue("error");

    const { updatePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await expect(
      updatePassKey({ userContext, ...requestData })
    ).rejects.toEqual({ message: "Error getting documents from Firestore" });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(updateDoc).not.toHaveBeenCalled();
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if fails to encrypt", async () => {
    const { encrypt } = require("./cryptoutil");
    encrypt.mockImplementation(() => {
      throw new Error("encryption error");
    });

    const { getDocs, updateDoc } = require("firebase/firestore");

    const { updatePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
      password: "requestPassword",
    };
    await expect(
      updatePassKey({ userContext, ...requestData })
    ).rejects.toEqual({ message: "Error encrypting passkey" });

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: requestData.password,
      key: userDecodedPassword,
    });
    expect(getDocs).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });
});

describe("deletePassKey", () => {
  const env = process.env;
  const mockQuery = "query";
  const mockLimit = "limit";
  const userContext = {
    user: { username: "testuser", password: "testpassword" },
  };

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    mockFirestore();
    process.env = {
      ...env,
      REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME: "testkeys",
    };

    const { collection, query, limit } = require("firebase/firestore");
    collection.mockReturnValue(mockCollection);
    query.mockReturnValue(mockQuery);
    limit.mockReturnValue(mockLimit);
  });
  afterEach(() => {
    process.env = env;
  });

  function verifyArgs({ userContext, account, username }) {
    const { query, where, limit } = require("firebase/firestore");
    expect(where).toHaveBeenCalledWith(
      "owner",
      "==",
      userContext.user.username
    );
    expect(where).toHaveBeenCalledWith("account", "==", account);
    expect(where).toHaveBeenCalledWith("username", "==", username);
    expect(query).toHaveBeenCalledWith(
      mockCollection,
      mockWhereOwner,
      mockWhereAccount,
      mockWhereUsername,
      mockLimit
    );
    expect(limit).toHaveBeenCalledWith(1);
  }

  test("throws error for invalid user context", async () => {
    const { deletePassKey } = require("./firestoredb");
    const invalidUserContexts = getInvalidUserContexts();
    for (let userContext of invalidUserContexts) {
      await expect(deletePassKey({ userContext })).rejects.toEqual({
        message: "Error validating user context",
      });
    }
  });

  test("deletes key", async () => {
    const { getDocs, deleteDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [{ id: 1, ref: "ref" }],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);
    deleteDoc.mockResolvedValue({});

    const { deletePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await deletePassKey({ userContext, ...requestData });

    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(deleteDoc).toHaveBeenCalledWith("ref");
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if deleteDoc fails", async () => {
    const { getDocs, deleteDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [{ id: 1, ref: "ref" }],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);
    deleteDoc.mockRejectedValue("error");

    const { deletePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(
      deletePassKey({ userContext, ...requestData })
    ).rejects.toEqual({ message: "Error deleting passkey from Firestore" });

    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(deleteDoc).toHaveBeenCalledWith("ref");
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if passkey not found", async () => {
    const { getDocs, deleteDoc } = require("firebase/firestore");
    let querySnapshot = {
      docs: [],
      empty: true,
    };
    getDocs.mockResolvedValue(querySnapshot);

    const { deletePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(
      deletePassKey({ userContext, ...requestData })
    ).rejects.toEqual({ message: "Passkey not found" });

    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(deleteDoc).not.toHaveBeenCalled();
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if getDocs fails", async () => {
    const { getDocs, deleteDoc } = require("firebase/firestore");
    getDocs.mockRejectedValue("error");

    const { deletePassKey } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(
      deletePassKey({ userContext, ...requestData })
    ).rejects.toEqual({ message: "Error getting documents from Firestore" });

    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(deleteDoc).not.toHaveBeenCalled();
    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });
});

describe("getHistory", () => {
  let env = process.env;
  const mockQuery = "query";
  const mockLimit = "limit";

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    mockFirestore();
    process.env = {
      ...env,
      REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME: "testkeys",
    };

    const { collection, query, limit } = require("firebase/firestore");
    collection.mockReturnValue(mockCollection);
    query.mockReturnValue(mockQuery);
    limit.mockReturnValue(mockLimit);
  });
  afterEach(() => {
    process.env = env;
  });

  function verifyArgs({ userContext, account, username }) {
    const { query, where, limit, getDocs } = require("firebase/firestore");
    expect(where).toHaveBeenCalledWith(
      "owner",
      "==",
      userContext.user.username
    );
    expect(where).toHaveBeenCalledWith("account", "==", account);
    expect(where).toHaveBeenCalledWith("username", "==", username);
    expect(query).toHaveBeenCalledWith(
      mockCollection,
      mockWhereOwner,
      mockWhereAccount,
      mockWhereUsername,
      mockLimit
    );
    expect(limit).toHaveBeenCalledWith(1);
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
  }

  test("throws error for invalid user context", async () => {
    const { getHistory } = require("./firestoredb");
    const invalidUserContexts = getInvalidUserContexts();
    for (let userContext of invalidUserContexts) {
      await expect(getHistory({ userContext })).rejects.toEqual({
        message: "Error validating user context",
      });
    }
  });

  test("retrieves empty history when it does not exist", async () => {
    // setup mocks for decrypt and getUserFromContext
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { getUserFromContext } = require("./contextutil");
    const decodedKey = "decodedKey";
    getUserFromContext.mockReturnValue({ password: decodedKey });

    // setup mock response for getDocs
    const { getDocs } = require("firebase/firestore");
    let data = {
      account: "testaccount",
      username: "testusername",
      password: "userpassword",
    };
    let querySnapshot = {
      docs: [
        { data: () => ({ ...data }) },
        // this should be ignored
        {
          data: () => ({
            account: "testaccount2",
            username: "testusername2",
            password: "userpassword2",
          }),
        },
      ],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);

    // call getHistory
    const { getHistory } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    let history = await getHistory({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
    expect(getUserFromContext).toHaveBeenCalledWith(userContext.user);
    expect(history).toEqual([]);
  });

  test("retrieves history in reverse order when it exists", async () => {
    // setup mocks for decrypt and getUserFromContext
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { decrypt } = require("./cryptoutil");
    const { getUserFromContext } = require("./contextutil");
    const decodedKey = "decodedKey";
    getUserFromContext.mockReturnValue({ password: decodedKey });

    // setup mock response for getDocs
    const { getDocs } = require("firebase/firestore");
    let now = Date.now();
    let querySnapshot = {
      docs: [
        {
          data: () => ({
            account: "testaccount2",
            username: "testusername2",
            password: "userpassword2",
            history: [
              { password: "cipherpassword1", changedAt: now },
              { password: "cipherpassword2", changedAt: now },
            ],
          }),
        },
      ],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);

    // mock response for decrypter
    decrypt.mockReturnValueOnce("plainpassword1");
    decrypt.mockReturnValueOnce("plainpassword2");

    // call getHistory
    const { getHistory } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    let history = await getHistory({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
    expect(getUserFromContext).toHaveBeenCalledWith(userContext.user);
    expect(decrypt).toHaveBeenCalledWith({
      ciphertext: "cipherpassword1",
      key: decodedKey,
    });
    expect(decrypt).toHaveBeenCalledWith({
      ciphertext: "cipherpassword2",
      key: decodedKey,
    });
    expect(history).toEqual([
      { password: "plainpassword2", changedAt: expect.any(String) },
      { password: "plainpassword1", changedAt: expect.any(String) },
    ]);
  });

  test("rejects if fails to decrypt", async () => {
    // setup mocks for decrypt and getUserFromContext
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { decrypt } = require("./cryptoutil");
    const { getUserFromContext } = require("./contextutil");
    const decodedKey = "decodedKey";
    getUserFromContext.mockReturnValue({ password: decodedKey });

    // setup mock response for getDocs
    const { getDocs } = require("firebase/firestore");
    let now = Date.now();
    let querySnapshot = {
      docs: [
        {
          data: () => ({
            account: "testaccount2",
            username: "testusername2",
            password: "userpassword2",
            history: [
              { password: "cipherpassword1", changedAt: now },
              { password: "cipherpassword2", changedAt: now },
            ],
          }),
        },
      ],
      empty: false,
    };
    getDocs.mockResolvedValue(querySnapshot);

    // mock response for decrypter
    decrypt.mockImplementation(() => {
      throw new Error("decryption error");
    });

    // call getHistory
    const { getHistory } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(getHistory({
      userContext,
      account: requestData.account,
      username: requestData.username,
    })).rejects.toEqual({ message: "Error decrypting passkey" });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
    expect(getUserFromContext).toHaveBeenCalledWith(userContext.user);
    expect(decrypt).toHaveBeenCalledWith({
      ciphertext: "cipherpassword1",
      key: decodedKey,
    });
  });

  test("rejects if doc is not found", async () => {
    // setup mocks for decrypt and getUserFromContext
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { getUserFromContext } = require("./contextutil");
    const decodedKey = "decodedKey";
    getUserFromContext.mockReturnValue({ password: decodedKey });

    // setup mock response for getDocs
    const { getDocs } = require("firebase/firestore");
    let querySnapshot = {
      docs: [],
      empty: true,
    };
    getDocs.mockResolvedValue(querySnapshot);

    // call getHistory
    const { getHistory } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(getHistory({
      userContext,
      account: requestData.account,
      username: requestData.username,
    })).rejects.toEqual({ message: "Passkey not found" });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });

  test("rejects if fails to getDocs", async () => {
    // setup mocks for decrypt and getUserFromContext
    const userContext = {
      user: { username: "testuser", password: "encodedpassword" },
    };
    const { getUserFromContext } = require("./contextutil");
    const decodedKey = "decodedKey";
    getUserFromContext.mockReturnValue({ password: decodedKey });

    // setup mock response for getDocs
    const { getDocs } = require("firebase/firestore");
    getDocs.mockRejectedValue("error");

    // call getHistory
    const { getHistory } = require("./firestoredb");
    let requestData = {
      account: "requestAccount",
      username: "requestUsername",
    };
    await expect(getHistory({
      userContext,
      account: requestData.account,
      username: requestData.username,
    })).rejects.toEqual({ message: "Error getting documents from Firestore" });

    verifyArgs({
      userContext,
      account: requestData.account,
      username: requestData.username,
    });
  });
});
