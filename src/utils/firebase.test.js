const mockInitializeApp = jest.fn();
const mockGetAuth = jest.fn();
const mockGetFirestore = jest.fn();

jest.mock("firebase/app", () => {
  return {
    initializeApp: mockInitializeApp,
  };
});

jest.mock("firebase/auth", () => {
  return {
    getAuth: mockGetAuth,
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  };
});

jest.mock("firebase/firestore", () => {
  return {
    getFirestore: mockGetFirestore,
  };
});

const mockAppObject = { x: 1, y: 2 };
const mockAuthObject = { a: 3, b: 4 };
const mockFirestoreObject = { p: 5, q: 6 };

const setupFirebaseMocks = () => {
  mockInitializeApp.mockReturnValue(mockAppObject);
  mockGetAuth.mockReturnValue(mockAuthObject);
  mockGetFirestore.mockReturnValue(mockFirestoreObject);
}

describe("firebase", () => {
  const oldEnv = process.env;
  const mockFirebaseConfig = {a: 1, b: 2};
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...oldEnv, REACT_APP_FIREBASE_CONFIG: JSON.stringify(mockFirebaseConfig) };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  test("should initialize resources", () => {
    setupFirebaseMocks();
    require("./firebase");
    expect(mockInitializeApp).toHaveBeenCalledWith(mockFirebaseConfig);
    expect(mockGetAuth).toHaveBeenCalledWith(mockAppObject);
    expect(mockGetFirestore).toHaveBeenCalledWith(mockAppObject);
  });
});

describe("signUp", () => {
  const oldEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...oldEnv, REACT_APP_FIREBASE_CONFIG: "{}" };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  test("should call createUserWithEmailAndPassword", async () => {
    setupFirebaseMocks();

    const firebaseAuth = require("firebase/auth");
    const { signUp } = require("./firebase");
    const email = "test@test.com";
    const password = "testpassword";

    let userCredential = { user: { email } };
    firebaseAuth.createUserWithEmailAndPassword.mockResolvedValue(userCredential);

    let user = await signUp({ email, password });

    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, email, password);
    expect(user).toEqual(userCredential.user);
  });

  test("should reject with error", async () => {
    setupFirebaseMocks();

    const firebaseAuth = require("firebase/auth");
    const { signUp } = require("./firebase");
    const email = "test@test.com";
    const password = "testpassword";

    let error = new Error("error");
    firebaseAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

    await expect(signUp({ email, password })).rejects.toEqual(error);
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, email, password);
  });
});

describe("signIn", () => {
  const oldEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...oldEnv, REACT_APP_FIREBASE_CONFIG: "{}" };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  test("should call signInWithEmailAndPassword", async () => {
    setupFirebaseMocks();

    const firebaseAuth = require("firebase/auth");
    const { signIn } = require("./firebase");
    const email = "test@test.com";
    const password = "testpassword";

    let userCredential = { user: { email } };
    firebaseAuth.signInWithEmailAndPassword.mockResolvedValue(userCredential);

    let user = await signIn({ email, password });

    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, email, password);
    expect(user).toEqual(userCredential.user);
  });

  test("should reject with error", async () => {
    setupFirebaseMocks();

    const firebaseAuth = require("firebase/auth");
    const { signIn } = require("./firebase");
    const email = "test@test.com";
    const password = "testpassword";

    let error = new Error("error");
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(error);

    await expect(signIn({ email, password })).rejects.toEqual(error);
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, email, password);
  });
});

describe("signOut", () => {
  const oldEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...oldEnv, REACT_APP_FIREBASE_CONFIG: "{}" };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  test("should call signOut", () => {
    setupFirebaseMocks();

    const firebaseAuth = require("firebase/auth");
    const { signOut } = require("./firebase");

    signOut();

    expect(firebaseAuth.signOut).toHaveBeenCalledWith(mockAuthObject);
  });
});

describe("getCurrentUser", () => {
  const oldEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...oldEnv, REACT_APP_FIREBASE_CONFIG: "{}" };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  test("should return current user", () => {
    setupFirebaseMocks();

    const { getCurrentUser } = require("./firebase");

    let currentUser = { email: "test@test.com" };
    mockAuthObject.currentUser = currentUser;

    let user = getCurrentUser();

    expect(user).toEqual(currentUser);
  });
});
