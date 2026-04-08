import { createRepositories } from "@repositories";

describe("createRepositories", () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it("throws when DATABASE_URL is not set", () => {
    delete process.env.DATABASE_URL;
    expect(() => createRepositories()).toThrow("DATABASE_URL environment variable is required");
  });

  it("throws when DATABASE_URL is empty", () => {
    process.env.DATABASE_URL = "";
    expect(() => createRepositories()).toThrow("DATABASE_URL environment variable is required");
  });
});
