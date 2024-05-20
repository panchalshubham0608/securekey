// Mocking the dependencies
jest.mock("../utils/firebase", () => {
  return {
    firestoreDb: jest.fn(),
  }
});
jest.mock("../utils/firestoredb", () => ({
  getPassKeys: jest.fn(),
  deletePassKey: jest.fn(),
}));

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import KeysList from "./KeysList";
import UserContext from "../context/UserContext";
import { getPassKeys } from "../utils/firestoredb";

const renderKeysListWithUserContext = (userContextValue, props = {}) => {
  return render(
    <UserContext.Provider value={userContextValue}>
      <KeysList {...props} />
    </UserContext.Provider>
  );
};

describe("KeysList component", () => {
  let setUser;

  beforeEach(() => {
    setUser = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders Navbar, search input, and loading spinner", async () => {
    getPassKeys.mockResolvedValue([
      { account: "test1", username: "user1" },
      { account: "test2", username: "user2" },
    ]);
    renderKeysListWithUserContext({ setUser });

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("loader")).toBeInTheDocument();

    await waitFor(() => expect(getPassKeys).toHaveBeenCalledTimes(1));
  });

  test("renders list of keys", async () => {
    getPassKeys.mockResolvedValue([
      { account: "test1", username: "user1" },
      { account: "test2", username: "user2" },
    ]);
    renderKeysListWithUserContext({ setUser });

    await waitFor(() => expect(getPassKeys).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());

    expect(screen.getByText("test1")).toBeInTheDocument();
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("test2")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
  });

  test("renders list of keys in order of account and usernames", async () => {
    getPassKeys.mockResolvedValue([
      { account: "test2", username: "user1" },
      { account: "test1", username: "user1" },
      { account: "test1", username: "user2" },
    ]);
    renderKeysListWithUserContext({ setUser });

    await waitFor(() => expect(getPassKeys).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());

    const accounts = screen.getAllByTestId("key-account");
    const usernames = screen.getAllByTestId("key-username");
    expect(accounts[0]).toHaveTextContent("test1");
    expect(usernames[0]).toHaveTextContent("user1");
    expect(accounts[1]).toHaveTextContent("test1");
    expect(usernames[1]).toHaveTextContent("user2");
    expect(accounts[2]).toHaveTextContent("test2");
    expect(usernames[2]).toHaveTextContent("user1");
  });

  test("shows correct count of keys", async () => {
    getPassKeys.mockResolvedValue([
      { account: "test1", username: "user1" },
      { account: "test2", username: "user2" },
    ]);
    renderKeysListWithUserContext({ setUser });

    await waitFor(() => expect(getPassKeys).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());

    expect(screen.getByTestId("keys-list-count").textContent).toBe("Accounts (2)");
  });

  test("shows error message on fetch failure", async () => {
    getPassKeys.mockRejectedValue(new Error("Server down"));

    renderKeysListWithUserContext({ setUser });

    await waitFor(() => expect(getPassKeys).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());

    expect(screen.getByTestId("keys-list-error").textContent).toBe("Server down");
    expect(screen.queryByTestId("keys-account")).not.toBeInTheDocument();
  });

  test("filters keys based on search input", async () => {
    getPassKeys.mockResolvedValue([
      { account: "test1", username: "user1" },
      { account: "test2", username: "user2" },
      { account: "prefixedtest1", username: "user3" }
    ]);
    renderKeysListWithUserContext({ setUser });

    await waitFor(() => expect(getPassKeys).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());

    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "test1" } });

    await waitFor(() => {
      expect(screen.getByText("test1")).toBeInTheDocument();
      expect(screen.queryByText("prefixedtest1")).toBeInTheDocument();
      expect(screen.queryByText("test2")).not.toBeInTheDocument();
    });
  });

  test("shows empty message when no keys are found", async () => {
    getPassKeys.mockResolvedValue([
      { account: "test1", username: "user1" },
      { account: "test2", username: "user2" },
    ]);
    renderKeysListWithUserContext({ setUser });

    await waitFor(() => expect(getPassKeys).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());

    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "test3" } });

    await waitFor(() => {
      let noKeysElement = screen.getByTestId("keys-list-no-keys");
      expect(noKeysElement).toBeInTheDocument();
      expect(noKeysElement.textContent).toBe("No keys found");
    });
  });
});
