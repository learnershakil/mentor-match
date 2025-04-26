import { NextResponse } from "next/server";
import { mockNextRequest } from "../../utils/apiTestHelpers";
import { getPrismaMock } from "../../mocks/prismaMock";
import { POST } from "@/app/api/auth/signup/route";
import bcrypt from "bcryptjs";

// Mock bcrypt for password hashing
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

describe("Signup API", () => {
  const prismaMock = getPrismaMock();

  // Valid signup data
  const validStudentData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "Password123!",
    role: "STUDENT",
    intrest: "WebDevelopment",
    level: "BEGINNER",
  };

  const validMentorData = {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    password: "Password123!",
    role: "MENTOR",
    intrest: "AiMl",
    company: "Tech Co",
    jobTitle: "Senior Developer",
    experience: 5,
  };

  beforeEach(() => {
    // Mock Prisma findUnique to return null (user doesn't exist)
    prismaMock.user.findUnique.mockResolvedValue(null);

    // Mock user creation
    prismaMock.user.create.mockResolvedValue({
      id: "user123",
      ...validStudentData,
      password: "hashed-password",
      createdAt: new Date(),
      updatedAt: new Date(),
      phone: null,
      image: null,
      bio: null,
    });

    // Mock student and mentor creation
    prismaMock.student.create.mockResolvedValue({
      id: "student123",
      userId: "user123",
      learningInterests: ["WebDevelopment"],
      level: "BEGINNER",
    });
    prismaMock.mentor.create.mockResolvedValue({
      id: "mentor123",
      userId: "user123",
      specialties: ["AiMl"],
      company: "Tech Co",
      jobTitle: "Senior Developer",
      experience: 5,
      rating: 0,
      reviewCount: 0,
      availability: null,
    });
  });

  test("should create a student user successfully", async () => {
    const request = mockNextRequest(validStudentData);
    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.message).toBe("User created successfully");
    expect(responseData.user).toHaveProperty("id");
    expect(responseData.user).not.toHaveProperty("password");

    expect(bcrypt.hash).toHaveBeenCalledWith(validStudentData.password, 10);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.student.create).toHaveBeenCalledTimes(1);
  });

  test("should create a mentor user successfully", async () => {
    const request = mockNextRequest(validMentorData);
    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.message).toBe("User created successfully");
    expect(responseData.user).toHaveProperty("id");

    expect(bcrypt.hash).toHaveBeenCalledWith(validMentorData.password, 10);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.mentor.create).toHaveBeenCalledTimes(1);
  });

  test("should return error for existing email", async () => {
    // Mock that user already exists
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "existing123",
      email: validStudentData.email,
    } as any);

    const request = mockNextRequest(validStudentData);
    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.message).toBe("User with this email already exists");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  test("should validate required fields", async () => {
    const invalidData = {
      firstName: "John",
      // Missing lastName, email, and password
    };

    const request = mockNextRequest(invalidData);
    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.message).toBe("Missing required fields");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  test("should validate role enum values", async () => {
    const invalidRoleData = {
      ...validStudentData,
      role: "INVALID_ROLE", // Invalid role
    };

    const request = mockNextRequest(invalidRoleData);
    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.message).toBe("Invalid role");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  test("should validate interest enum values", async () => {
    const invalidInterestData = {
      ...validStudentData,
      intrest: "INVALID_INTEREST", // Invalid interest
    };

    const request = mockNextRequest(invalidInterestData);
    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.message).toBe("Invalid interest");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  test("should handle database errors gracefully", async () => {
    // Mock database error
    prismaMock.user.create.mockRejectedValueOnce(new Error("Database error"));

    const request = mockNextRequest(validStudentData);
    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.message).toBe("Internal server error");
  });
});
