import React from "react";
import { render, fireEvent, getAllByTestId } from "@testing-library/react";
import AddPassKey from "./AddPassKey";
import AccountIconsList from "../utils/AccountIconsList";

describe("AddPassKey", () => {
    test("renders without crashing", () => {
        render(<AddPassKey />);
    });    

    // test("displays the account icons list", () => {
    //     const { getByTestId } = render(<AddPassKey />);
    //     const accountIconsList = getByTestId("account-icons-list");
    //     expect(accountIconsList).toBeInTheDocument();
    // });

    // test("updates the pass key when input value changes", () => {
    //     const { getByTestId } = render(<AddPassKey />);
    //     const passKeyInput = getByTestId("pass-key-input");
    //     fireEvent.change(passKeyInput, { target: { value: "newPassKey" } });
    //     expect(passKeyInput.value).toBe("newPassKey");
    // });

    // test("calls the addPassKey function when the 'Add' button is clicked", () => {
    //     const addPassKeyMock = jest.fn();
    //     const { getByTestId } = render(<AddPassKey addPassKey={addPassKeyMock} />);
    //     const addButton = getByTestId("add-button");
    //     fireEvent.click(addButton);
    //     expect(addPassKeyMock).toHaveBeenCalled();
    // });

    // test("calls the updatePassKey function when the 'Update' button is clicked", () => {
    //     const updatePassKeyMock = jest.fn();
    //     const { getByTestId } = render(<AddPassKey updatePassKey={updatePassKeyMock} />);
    //     const updateButton = getByTestId("update-button");
    //     fireEvent.click(updateButton);
    //     expect(updatePassKeyMock).toHaveBeenCalled();
    // });
});

describe("AccountsList", () => {
    test("should contain all the account icons", () => {
        const { getAllByTestId } = render(<AddPassKey />);
        const accountIcons = getAllByTestId("account-list-item");
        expect(accountIcons).toHaveLength(Object.keys(AccountIconsList).length);
    });

    test("should filter the account icons when search text changes", () => {
        const { getByTestId, getAllByTestId } = render(<AddPassKey />);
        const searchInput = getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "Google" } });
        const accountIcons = getAllByTestId("account-list-item");
        expect(accountIcons).toHaveLength(1);
    });

    test("shows empty list when no account icons match the search text", () => {
        const { getByTestId } = render(<AddPassKey />);
        const searchInput = getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "Unknown" } });
        const emptyList = getByTestId("empty-list");
        expect(emptyList).toBeInTheDocument();
    });

    test("clears the search text when the 'x' button is clicked", () => {
        const { getByTestId, getAllByTestId } = render(<AddPassKey />);
        const searchInput = getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "Google" } });
        const accountIcons = getAllByTestId("account-list-item");
        expect(accountIcons).toHaveLength(1);
        const clearButton = getByTestId("clear-button");
        fireEvent.click(clearButton);
        expect(searchInput.value).toBe("");
        const allAccountIcons = getAllByTestId("account-list-item");
        expect(allAccountIcons).toHaveLength(Object.keys(AccountIconsList).length);
    });
});