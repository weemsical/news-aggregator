import { User } from "../types";
import { UserRepository } from "../repositories/UserRepository";

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  email: "alice@example.com",
  passwordHash: "$2b$10$fakehashvalue1234567890",
  createdAt: 1740000060000,
  ...overrides,
});

export function userRepositoryContractTests(
  createRepo: () => Promise<UserRepository>
) {
  let repo: UserRepository;

  beforeEach(async () => {
    repo = await createRepo();
  });

  it("returns undefined when finding by email that does not exist", async () => {
    expect(await repo.findByEmail("nobody@example.com")).toBeUndefined();
  });

  it("returns undefined when finding by id that does not exist", async () => {
    expect(await repo.findById("no-such-id")).toBeUndefined();
  });

  it("saves and retrieves a user by email", async () => {
    const user = makeUser();
    await repo.save(user);

    const found = await repo.findByEmail("alice@example.com");
    expect(found).toEqual(user);
  });

  it("saves and retrieves a user by id", async () => {
    const user = makeUser();
    await repo.save(user);

    const found = await repo.findById("user-1");
    expect(found).toEqual(user);
  });

  it("does not create duplicates on repeated save (same id)", async () => {
    const user = makeUser();
    await repo.save(user);
    await repo.save(user);

    expect(await repo.count()).toBe(1);
  });

  it("returns count of stored users", async () => {
    expect(await repo.count()).toBe(0);

    await repo.save(makeUser());
    expect(await repo.count()).toBe(1);

    await repo.save(makeUser({ id: "user-2", email: "bob@example.com" }));
    expect(await repo.count()).toBe(2);
  });

  it("rejects user with empty email", async () => {
    await expect(repo.save(makeUser({ email: "" }))).rejects.toThrow();
  });

  it("rejects user with empty passwordHash", async () => {
    await expect(repo.save(makeUser({ passwordHash: "" }))).rejects.toThrow();
  });

  it("treats email lookups as case-insensitive", async () => {
    await repo.save(makeUser({ email: "Alice@Example.COM" }));

    const found = await repo.findByEmail("alice@example.com");
    expect(found).toBeDefined();
    expect(found!.email).toBe("Alice@Example.COM");
  });
}
