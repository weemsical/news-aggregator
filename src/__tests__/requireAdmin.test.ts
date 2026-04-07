import { Request, Response, NextFunction } from "express";
import { createRequireAdmin } from "../server/middleware/requireAdmin";
import { TestInMemoryUserRepository } from "./helpers/TestInMemoryUserRepository";

function mockReqRes(user?: { userId: string }) {
  const req = { user } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

const adminUser = {
  id: "admin-1",
  email: "admin@example.com",
  passwordHash: "hash",
  createdAt: Date.now(),
};

const regularUser = {
  id: "user-1",
  email: "user@example.com",
  passwordHash: "hash",
  createdAt: Date.now(),
};

describe("requireAdmin", () => {
  const originalEnv = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_EMAILS = originalEnv;
    } else {
      delete process.env.ADMIN_EMAILS;
    }
  });

  it("returns 401 when req.user is not set", async () => {
    const users = new TestInMemoryUserRepository();
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when ADMIN_EMAILS is not set", async () => {
    delete process.env.ADMIN_EMAILS;
    const users = new TestInMemoryUserRepository();
    await users.save(adminUser);
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "admin-1" });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when ADMIN_EMAILS is empty", async () => {
    process.env.ADMIN_EMAILS = "";
    const users = new TestInMemoryUserRepository();
    await users.save(adminUser);
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "admin-1" });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when user ID is not found in repository", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const users = new TestInMemoryUserRepository();
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "nonexistent" });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user email is not in ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const users = new TestInMemoryUserRepository();
    await users.save(regularUser);
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "user-1" });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when user email is in ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const users = new TestInMemoryUserRepository();
    await users.save(adminUser);
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "admin-1" });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("compares emails case-insensitively", async () => {
    process.env.ADMIN_EMAILS = "Admin@Example.COM";
    const users = new TestInMemoryUserRepository();
    await users.save(adminUser);
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "admin-1" });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("supports multiple comma-separated admin emails", async () => {
    process.env.ADMIN_EMAILS = "other@example.com, admin@example.com, third@example.com";
    const users = new TestInMemoryUserRepository();
    await users.save(adminUser);
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "admin-1" });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
