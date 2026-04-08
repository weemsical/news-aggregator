import { Request, Response, NextFunction } from "express";
import { requireAuth, optionalAuth } from "@middleware";
import { signToken } from "../server/auth";

function mockReqRes(cookies: Record<string, string> = {}) {
  const req = { cookies } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe("requireAuth", () => {
  it("calls next and sets req.user with valid token", () => {
    const token = signToken("user-1");
    const { req, res, next } = mockReqRes({ token });
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: "user-1" });
  });

  it("returns 401 when no token cookie", () => {
    const { req, res, next } = mockReqRes();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", () => {
    const { req, res, next } = mockReqRes({ token: "bad-token" });
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("optionalAuth", () => {
  it("sets req.user with valid token", () => {
    const token = signToken("user-1");
    const { req, res, next } = mockReqRes({ token });
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: "user-1" });
  });

  it("calls next without setting user when no token", () => {
    const { req, res, next } = mockReqRes();
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
