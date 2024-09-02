// tests/validateUserContext.test.js
import { validateUserContext } from "./contextvalidator";

describe("validateUserContext", () => {
    test("should resolve with valid userContext", async () => {
        const validUserContext = {
            user: {
                username: "testUser",
                password: "testPassword",
            },
        };

        await expect(validateUserContext(validUserContext)).resolves.toEqual(validUserContext);
    });

    test("should reject if userContext is not provided", async () => {
        await expect(validateUserContext(null)).rejects.toEqual("User context not found");
    });

    test("should reject if user is not found in userContext", async () => {
        const invalidUserContext = {};
        await expect(validateUserContext(invalidUserContext)).rejects.toEqual("User not found in user context");
    });

    test("should reject if username is not found in userContext", async () => {
        const invalidUserContext = {
            user: {
                password: "testPassword",
            },
        };
        await expect(validateUserContext(invalidUserContext)).rejects.toEqual("Username not found in user context");
    });

    test("should reject if password is not found in userContext", async () => {
        const invalidUserContext = {
            user: {
                username: "testUser",
            },
        };
        await expect(validateUserContext(invalidUserContext)).rejects.toEqual("Password not found in user context");
    });
});
