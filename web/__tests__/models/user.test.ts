import { PrismaClient, UserRole, Interest } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { getPrismaMock } from "../mocks/prismaMock";

describe("User Model", () => {
  const prismaMock = getPrismaMock();

  // Mock user data
  const mockUser = {
    id: "user123",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "hashed-password",
    role: "STUDENT" as UserRole,
    intrest: "WebDevelopment" as Interest,
    createdAt: new Date(),
    updatedAt: new Date(),
    phone: null,
    image: null,
    bio: null,
  };

  beforeEach(() => {
    mockReset(prismaMock);
  });

  test("should create a user", async () => {
    prismaMock.user.create.mockResolvedValue(mockUser);

    const user = await prismaMock.user.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "hashed-password",
        role: "STUDENT",
        intrest: "WebDevelopment",
      },
    });

    expect(user).toEqual(mockUser);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
  });

  test("should find a user by email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const user = await prismaMock.user.findUnique({
      where: { email: "john@example.com" },
    });

    expect(user).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "john@example.com" },
    });
  });

  test("should find a user by ID", async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const user = await prismaMock.user.findUnique({
      where: { id: "user123" },
    });

    expect(user).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user123" },
    });
  });

  test("should update a user", async () => {
    const updatedUser = { ...mockUser, firstName: "Jane", lastName: "Smith" };
    prismaMock.user.update.mockResolvedValue(updatedUser);

    const user = await prismaMock.user.update({
      where: { id: "user123" },
      data: { firstName: "Jane", lastName: "Smith" },
    });

    expect(user).toEqual(updatedUser);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: { firstName: "Jane", lastName: "Smith" },
    });
  });

  test("should delete a user", async () => {
    prismaMock.user.delete.mockResolvedValue(mockUser);

    const user = await prismaMock.user.delete({
      where: { id: "user123" },
    });

    expect(user).toEqual(mockUser);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: "user123" },
    });
  });
});
