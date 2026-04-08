import { dateSeededHash } from "@services";

describe("dateSeededHash", () => {
  it("returns the same value for the same inputs", () => {
    const a = dateSeededHash("article-1", "2025-03-15");
    const b = dateSeededHash("article-1", "2025-03-15");
    expect(a).toBe(b);
  });

  it("returns different values for different article IDs", () => {
    const a = dateSeededHash("article-1", "2025-03-15");
    const b = dateSeededHash("article-2", "2025-03-15");
    expect(a).not.toBe(b);
  });

  it("returns different values for different dates", () => {
    const a = dateSeededHash("article-1", "2025-03-15");
    const b = dateSeededHash("article-1", "2025-03-16");
    expect(a).not.toBe(b);
  });

  it("returns a non-negative number", () => {
    const result = dateSeededHash("test", "2025-01-01");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
