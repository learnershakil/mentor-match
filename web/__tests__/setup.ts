import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";

// Mock Prisma Client
jest.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Mock Next Auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock Google Generative AI
jest.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(() => ({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue("Mocked AI response"),
          },
        }),
      })),
    })),
  };
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  const { prisma } = require("@/lib/prisma");
  mockReset(prisma);
});

// Set default environment variables for tests
process.env.GEMINI_API_KEY = "test-gemini-key";
