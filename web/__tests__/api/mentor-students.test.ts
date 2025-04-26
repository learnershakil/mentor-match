import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { GET } from "@/app/api/mentor/students/route";

describe("GET /api/mentor/students", () => {
  const prismaMock = getPrismaMock();

  beforeEach(() => {
    // Set up authenticated mentor session for testing
    mockAuthSession("MENTOR");

    // Mock mentor retrieval with specialties
    prismaMock.mentor.findFirst.mockResolvedValue({
      id: "mentor1",
      userId: "user123",
      specialties: ["WebDevelopment", "AiMl"],
    } as any);

    // Mock user data with interest
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user123",
      firstName: "Jane",
      lastName: "Mentor",
      email: "jane@example.com",
      role: "MENTOR",
      intrest: "WebDevelopment",
    } as any);

    // Mock students with matching interests
    prismaMock.student.findMany.mockResolvedValue([
      {
        id: "student1",
        userId: "student123",
        learningInterests: ["WebDevelopment"],
        level: "BEGINNER",
        user: {
          id: "student123",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          image: null,
          intrest: "WebDevelopment",
        },
        assignments: [],
      },
      {
        id: "student2",
        userId: "student456",
        learningInterests: ["AiMl"],
        level: "INTERMEDIATE",
        user: {
          id: "student456",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          image: null,
          intrest: "AiMl",
        },
        assignments: [],
      },
    ] as any);

    // Mock the count of matching students
    prismaMock.student.count.mockResolvedValue(2);
  });

  test("should return students with matching interests", async () => {
    const request = mockNextRequest({});
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty("students");
    expect(data).toHaveProperty("totalStudents");
    expect(data.students).toHaveLength(2);
    expect(data.totalStudents).toBe(2);
    expect(data.students[0]).toHaveProperty("name", "John Doe");
    expect(data.students[0]).toHaveProperty("interest", "WebDevelopment");
    expect(data.students[1]).toHaveProperty("name", "Jane Smith");
    expect(data.students[1]).toHaveProperty("interest", "AiMl");
  });

  test("should return empty array if no matching students", async () => {
    // Mock empty students result
    prismaMock.student.findMany.mockResolvedValueOnce([]);
    prismaMock.student.count.mockResolvedValueOnce(0);

    const request = mockNextRequest({});
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty("students");
    expect(data).toHaveProperty("totalStudents");
    expect(data.students).toHaveLength(0);
    expect(data.totalStudents).toBe(0);
  });

  test("should require mentor authentication", async () => {
    // Mock student session
    mockAuthSession("STUDENT");

    const request = mockNextRequest({});
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Only mentors can access this endpoint");
  });

  test("should handle errors gracefully", async () => {
    // Mock database error
    prismaMock.mentor.findFirst.mockRejectedValueOnce(
      new Error("Database error")
    );

    const request = mockNextRequest({});
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch students");
  });
});
