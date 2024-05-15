// imports
import { str2color } from "./str2color";

describe("str2color", () => {
    test("convert string to color", () => {
        // set the string
        let str = "hello world";

        // convert the string to color
        let color = str2color(str);

        // color should be a string
        expect(typeof color).toBe("string");

        // color should match the regex pattern
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    test("convert different strings to different colors", () => {
        // set the strings
        let str1 = "hello world";
        let str2 = "goodbye world";

        // convert the strings to colors
        let color1 = str2color(str1);
        let color2 = str2color(str2);

        // colors should not be equal
        expect(color1).not.toBe(color2);
    });

    test("convert same strings to same color", () => {
        // set the string
        let str = "hello world";

        // convert the string to color
        let color1 = str2color(str);
        let color2 = str2color(str);

        // colors should be equal
        expect(color1).toBe(color2);
    });
});