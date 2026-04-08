import { Request, Response, NextFunction } from "express";
import { createRequireAdmin } from "@middleware";
import { TestInMemoryUserRepository } from "@helpers";

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
  isAdmin: true,
  createdAt: Date.now(),
};

const regularUser = {
  id: "user-1",
  email: "user@example.com",
  passwordHash: "hash",
  isAdmin: false,
  createdAt: Date.now(),
};

describe("requireAdmin", () => {
  it("returns 401 when req.user is not set", async () => {
    const users = new TestInMemoryUserRepository();
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when user ID is not found in repository", async () => {
    const users = new TestInMemoryUserRepository();
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "nonexistent" });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not an admin", async () => {
    const users = new TestInMemoryUserRepository();
    await users.save(regularUser);
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "user-1" });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when user is an admin", async () => {
    const users = new TestInMemoryUserRepository();
    await users.save(adminUser);
    const requireAdmin = createRequireAdmin(users);
    const { req, res, next } = mockReqRes({ userId: "admin-1" });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
