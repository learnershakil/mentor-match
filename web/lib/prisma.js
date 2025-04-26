import { PrismaClient } from "@prisma/client";

// Use a type-safe global declaration for Prisma
const globalForPrisma = global;

// Check if prisma exists on the global object, otherwise initialize it
export const prisma = globalForPrisma.prisma || new PrismaClient();

// Add prisma to the global object in development to prevent multiple instances
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
