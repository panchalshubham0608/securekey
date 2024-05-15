import { generateStrongPassword } from "./passwordutil";

describe("generateStrongPassword", () => {
    test("should generate a password with the specified length", () => {
        const password = generateStrongPassword(10);
        expect(password.length).toBe(10);
    });

    test("should generate a password with only valid characters", () => {
        const password = generateStrongPassword(10);
        expect(password).toMatch(/^[A-Za-z0-9!@#$%^&*()]+$/);
    });

    test("should generate a different password each time", () => {
        const password1 = generateStrongPassword(10);
        const password2 = generateStrongPassword(10);
        expect(password1).not.toBe(password2);
    });    
});