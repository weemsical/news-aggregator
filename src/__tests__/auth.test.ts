import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  isValidEmail,
  isValidPassword,
} from "../server/auth";

describe("auth utilities", () => {
  describe("hashPassword / verifyPassword", () => {
    it("hashes and verifies a password", async () => {
      const hash = await hashPassword("mypassword");
      expect(hash).not.toBe("mypassword");
      expect(await verifyPassword("mypassword", hash)).toBe(true);
    });

    it("rejects wrong password", async () => {
      const hash = await hashPassword("mypassword");
      expect(await verifyPassword("wrongpassword", hash)).toBe(false);
    });

    it("produces different hashes for same input", async () => {
      const hash1 = await hashPassword("mypassword");
      const hash2 = await hashPassword("mypassword");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("signToken / verifyToken", () => {
    it("signs and verifies a token", () => {
      const token = signToken("user-123");
      const payload = verifyToken(token);
      expect(payload).toEqual({ userId: "user-123" });
    });

    it("returns null for invalid token", () => {
      expect(verifyToken("garbage")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(verifyToken("")).toBeNull();
    });
  });

  describe("isValidEmail", () => {
    it("accepts valid email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    it("rejects invalid email", () => {
      expect(isValidEmail("not-an-email")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("accepts password >= 8 chars", () => {
      expect(isValidPassword("12345678")).toBe(true);
    });

    it("rejects password < 8 chars", () => {
      expect(isValidPassword("1234567")).toBe(false);
      expect(isValidPassword("")).toBe(false);
    });
  });
});
