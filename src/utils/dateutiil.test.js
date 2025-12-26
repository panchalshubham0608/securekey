import { formatFirestoreTimestamp } from "./dateutil";

describe("dateutil", () => {
  test("should format a timestamp correctly to dd/mm/yyyy HH:MM", () => {
    const timestamp = new Date("2023-08-12T14:35:00Z").getTime(); // UTC timestamp
    const formattedDate = formatFirestoreTimestamp(timestamp);
    expect(formattedDate).toBe("12/08/2023 20:05");
  });

  test("should correctly pad single-digtest day and month with leading zero", () => {
    const timestamp = new Date("2023-02-05T09:05:00Z").getTime(); // UTC timestamp
    const formattedDate = formatFirestoreTimestamp(timestamp);
    expect(formattedDate).toBe("05/02/2023 14:35");
  });

  test("should handle different timezones correctly", () => {
    const timestamp = new Date("2023-08-12T00:00:00Z").getTime(); // UTC timestamp
    const formattedDate = formatFirestoreTimestamp(timestamp);
    expect(formattedDate).toBe("12/08/2023 05:30");
  });

  test("should handle a timestamp at midnight correctly", () => {
    const timestamp = new Date("2023-08-12T00:00:00Z").getTime(); // UTC timestamp
    const formattedDate = formatFirestoreTimestamp(timestamp);
    expect(formattedDate).toBe("12/08/2023 05:30");
  });

  test("should handle a timestamp at the last minute of the day correctly", () => {
    const timestamp = new Date("2023-08-12T23:59:00Z").getTime(); // UTC timestamp
    const formattedDate = formatFirestoreTimestamp(timestamp);
    expect(formattedDate).toBe("12/08/2023 05:29");
  });

  test("should throw fir invalid timestamps", () => {
    const invalidTimestamp = "invalid-date";
    expect(() => formatFirestoreTimestamp(invalidTimestamp)).toThrow();
  });
});
