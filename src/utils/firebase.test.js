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

const mockAppObject = {x: 1, y: 2};
const mockAuthObject = {a: 3, b: 4};
const mockFirestoreObject = {p: 5, q: 6};

const setupFirebaseMocks = () => {
  mockInitializeApp.mockReturnValue(mockAppObject);
  mockGetAuth.mockReturnValue(mockAuthObject);
  mockGetFirestore.mockReturnValue(mockFirestoreObject);
}

describe("firebase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize resources", () => {
    setupFirebaseMocks();
    require("./firebase");
    expect(mockInitializeApp).toHaveBeenCalled();
    expect(mockGetAuth).toHaveBeenCalledWith(mockAppObject);
    expect(mockGetFirestore).toHaveBeenCalledWith(mockAppObject);
  });
});

describe("signUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  beforeEach(() => {
    jest.clearAllMocks();
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
  beforeEach(() => {
    jest.clearAllMocks();
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
    jest.clearAllMocks();
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
