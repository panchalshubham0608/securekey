import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Navbar from "./Navbar";
import UserContext from "../context/UserContext";
import { signOut } from "../utils/firebase";

// Mocking the dependencies
jest.mock("../utils/firebase", () => ({
  signOut: jest.fn(),
}));

const renderNavbarWithUserContext = (userContextValue) => {
  return render(
    <UserContext.Provider value={userContextValue}>
      <Navbar />
    </UserContext.Provider>
  );
};

describe("Navbar component", () => {
  let setUser;

  beforeEach(() => {
    setUser = jest.fn();
  });

  test("renders logo and logout button", () => {
    renderNavbarWithUserContext({ setUser });

    const logo = screen.getByAltText("logo");
    const logoutButton = screen.getByTestId("logout-button");

    expect(logo).toBeInTheDocument();
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveTextContent("Logout");
  });

  test("calls signOut and setUser(null) on logout button click", () => {
    renderNavbarWithUserContext({ setUser });

    const logoutButton = screen.getByTestId("logout-button");
    fireEvent.click(logoutButton);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(setUser).toHaveBeenCalledWith(null);
  });
});
