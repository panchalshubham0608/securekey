import AccountIconsList from "./AccountIconsList";

const accountNames = [
  "AWS",
  "GitHub",
  "Google",
  "IncomeTax",
  "LinkedIn",
  "Microsoft",
  "NPM",
  "Paypal",
  "SBI",
  "UAN",
  "Udemy",
  "Other",
];

describe("AccountIconsList", () => {
  test("should have an icon for each account", () => {
    accountNames.forEach((accountName) => {
      expect(AccountIconsList[accountName]).toBeDefined();
    });
  });

  test("no account should have the same icon", () => {
    const icons = Object.values(AccountIconsList);
    const uniqueIcons = new Set(icons);
    expect(uniqueIcons.size).toBe(icons.length);
  });
});