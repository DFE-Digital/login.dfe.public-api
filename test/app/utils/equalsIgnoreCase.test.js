const equalsIgnoreCase = require("../../../src/app/utils/equalsIgnoreCase");

describe("equalsIgnoreCase", () => {
  it("returns true for the same GUID with different casing", () => {
    expect(
      equalsIgnoreCase(
        "01BB79D1-D14A-4BC0-9FA2-399D6B3B815D",
        "01bb79d1-d14a-4bc0-9fa2-399d6b3b815d",
      ),
    ).toBe(true);
  });

  it("returns true for identical strings", () => {
    expect(equalsIgnoreCase("abc-123", "abc-123")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(equalsIgnoreCase("abc-123", "abc-456")).toBe(false);
  });

  it("returns false when either value is undefined", () => {
    expect(equalsIgnoreCase(undefined, "abc-123")).toBe(false);
    expect(equalsIgnoreCase("abc-123", undefined)).toBe(false);
  });

  it("returns false when either value is null", () => {
    expect(equalsIgnoreCase(null, "abc-123")).toBe(false);
    expect(equalsIgnoreCase("abc-123", null)).toBe(false);
  });

  it("returns false when either value is not a string", () => {
    expect(equalsIgnoreCase(123, "123")).toBe(false);
    expect(equalsIgnoreCase("123", 123)).toBe(false);
  });
});
