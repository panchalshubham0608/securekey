import React from "react";
import { render } from "@testing-library/react";
import AccountIcon from "./AccountIcon";
import OtherIcon from "../assets/Other.svg";
import AccountIconsList from "../utils/AccountIconsList";

describe("AccountIcon", () => {
    test("renders the component", () => {
        render(<AccountIcon />);
    });

    Object.keys(AccountIconsList).forEach((account) => {
        it(`renders the ${account} icon`, () => {
            const { getByAltText } = render(<AccountIcon account={account} />);
            const accountIcon = getByAltText(account);
            expect(accountIcon).toBeInTheDocument();
        });
    });

    test("renders the 'Other' icon when account type is not found", () => {
        const account = "Unknown";
        const { getByAltText } = render(<AccountIcon account={account} />);
        const accountIcon = getByAltText(account);
        expect(accountIcon).toBeInTheDocument();
        expect(accountIcon).toHaveAttribute("src", OtherIcon);
    });

    test("renders just an img element", () => {
        const account = "Unknown";
        const { container } = render(<AccountIcon account={account} />);
        const imgElement = container.querySelector("img");
        expect(imgElement).toBeInTheDocument();
    });
});
