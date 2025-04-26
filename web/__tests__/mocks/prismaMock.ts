import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

// Create a deep mockable Prisma client for testing
export const prismaMock = mockDeep<PrismaClient>();

// Helper to import this mock in tests
export const getPrismaMock = (): MockPrismaClient => {
  const { prisma } = require("@/lib/prisma");
  return prisma as MockPrismaClient;
};
