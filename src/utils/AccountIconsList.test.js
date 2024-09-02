import fs from "fs";
import path from "path";
import AccountIconsList from "./AccountIconsList";

describe("AccountIconsList", () => {
  // gets the list of all the svg files in the assets/images
  function getAllSVGKeys() {
    const assetsDir = path.join(__dirname, "../assets/images");
    const svgFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith(".svg"));
    const svgFileKeys = svgFiles.map(file => path.basename(file, ".svg"));

    // remove logo.svg which is not supposed to be mapped
    let index = svgFileKeys.indexOf("logo");
    if (index !== -1) {
      svgFileKeys.splice(index, 1);
    }

    return svgFileKeys;
  }

  test("should map all SVG files in src/assets/images to a key in AccountIconsList", () => {
    const mappedKeys = Object.keys(AccountIconsList);
    const svgFileKeys = getAllSVGKeys();

    // sort both arrays and assert
    svgFileKeys.sort();
    mappedKeys.sort();
    expect(svgFileKeys).toEqual(mappedKeys);
  });

  test('should correctly map string keys to icon components', () => {
    const svgFileKeys = getAllSVGKeys();
    svgFileKeys.forEach(key => {
      expect(AccountIconsList[key]).toBe(`${key}.svg`);
    });
  });

  test("no account should have the same icon", () => {
    const icons = Object.values(AccountIconsList);
    const uniqueIcons = new Set(icons);
    expect(uniqueIcons.size).toBe(icons.length);
  });
});