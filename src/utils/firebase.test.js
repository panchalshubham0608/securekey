// Mocks for Firebase methods
const mockInitializeApp = jest.fn();
const mockGetAuth = jest.fn();
const mockGetFirestore = jest.fn();
const mockAppObject = { x: 1, y: 2 };
const mockAuthObject = { a: 3, b: 4 };
const mockFirestoreObject = { p: 5, q: 6 };

jest.mock("firebase/app", () => ({
  initializeApp: mockInitializeApp,
}));

jest.mock("firebase/auth", () => ({
  getAuth: mockGetAuth,
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: mockGetFirestore,
}));

const setupFirebaseMocks = () => {
  mockInitializeApp.mockReturnValue(mockAppObject);
  mockGetAuth.mockReturnValue(mockAuthObject);
  mockGetFirestore.mockReturnValue(mockFirestoreObject);
};

describe("Firebase Initialization", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.REACT_APP_FIREBASE_CONFIG = JSON.stringify({ a: 1, b: 2 });
  });

  test("should initialize resources", () => {
    setupFirebaseMocks();
    require("./firebase");
    expect(mockInitializeApp).toHaveBeenCalledWith({ a: 1, b: 2 });
    expect(mockGetAuth).toHaveBeenCalledWith(mockAppObject);
    expect(mockGetFirestore).toHaveBeenCalledWith(mockAppObject);
  });
});

describe("signUp", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.REACT_APP_FIREBASE_CONFIG = "{}";
  });

  test("should call createUserWithEmailAndPassword and resolve with user", async () => {
    setupFirebaseMocks();
    const firebaseAuth = require("firebase/auth");
    const { signUp } = require("./firebase");
    const email = "test@test.com";
    const password = "testpassword";
    const userCredential = { user: { email } };

    firebaseAuth.createUserWithEmailAndPassword.mockResolvedValue(userCredential);

    const user = await signUp({ email, password });

    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, email, password);
    expect(user).toEqual(userCredential.user);
  });

  test("should reject with error", async () => {
    setupFirebaseMocks();
    const firebaseAuth = require("firebase/auth");
    const { signUp } = require("./firebase");
    const email = "test@test.com";
    const password = "testpassword";
    const error = new Error("error");

    firebaseAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

    await expect(signUp({ email, password })).rejects.toThrow("error");
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, email, password);
  });
});

describe("signIn", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.REACT_APP_FIREBASE_CONFIG = "{}";
  });

  test("should call signInWithEmailAndPassword and resolve with user", async () => {
    setupFirebaseMocks();
    const firebaseAuth = require("firebase/auth");
    const { signIn } = require("./firebase");
    const email = "test@test.com";
    const password = "testpassword";
    const userCredential = { user: { email } };

    firebaseAuth.signInWithEmailAndPassword.mockResolvedValue(userCredential);

    const user = await signIn({ email, password });

    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, email, password);
    expect(user).toEqual(userCredential.user);
  });

  test("should reject with error", async () => {
    setupFirebaseMocks();
    const firebaseAuth = require("firebase/auth");
    const { signIn } = require("./firebase");
    const email = "test@test.com";
    const password = "testpassword";
    const error = new Error("error");

    firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(error);

    await expect(signIn({ email, password })).rejects.toThrow("error");
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuthObject, email, password);
  });
});

describe("signOut", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.REACT_APP_FIREBASE_CONFIG = "{}";
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
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.REACT_APP_FIREBASE_CONFIG = "{}";
  });

  test("should return current user", () => {
    setupFirebaseMocks();
    const { getCurrentUser } = require("./firebase");
    const currentUser = { email: "test@test.com" };
    mockAuthObject.currentUser = currentUser;

    const user = getCurrentUser();

    expect(user).toEqual(currentUser);
  });
});
