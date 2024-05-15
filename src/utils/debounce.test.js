import debounce from "./debounce";

jest.useFakeTimers();

describe("debounce", () => {
    test("should call the function after the delay", () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 1000);

        debouncedFunc();
        expect(func).not.toHaveBeenCalled();

        jest.runAllTimers();
        expect(func).toHaveBeenCalled();
    });

    test("should call the function only once", () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 1000);

        debouncedFunc();
        debouncedFunc();
        debouncedFunc();
        debouncedFunc();
        debouncedFunc();
        expect(func).not.toHaveBeenCalled();

        jest.runAllTimers();
        expect(func).toHaveBeenCalledTimes(1);
    });

    test("should call the function with the correct arguments", () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 1000);

        debouncedFunc(1, 2, 3);
        expect(func).not.toHaveBeenCalled();

        jest.runAllTimers();
        expect(func).toHaveBeenCalledWith(1, 2, 3);
    });
});
