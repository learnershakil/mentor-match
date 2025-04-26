import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

export const mockNextRequest = (body: any): NextRequest => {
  return {
    json: jest.fn().mockResolvedValue(body),
    url: "http://localhost:3000/api/test",
    headers: new Headers(),
  } as unknown as NextRequest;
};

export const mockSession = (
  role: "STUDENT" | "MENTOR" | "ADMIN" = "STUDENT",
  overrides = {}
) => {
  return {
    user: {
      id: "user123",
      name: "Test User",
      email: "test@example.com",
      role,
      ...overrides,
    },
  };
};

export const mockAuthSession = (
  role: "STUDENT" | "MENTOR" | "ADMIN" = "STUDENT"
) => {
  (getServerSession as jest.Mock).mockResolvedValue(mockSession(role));
};
