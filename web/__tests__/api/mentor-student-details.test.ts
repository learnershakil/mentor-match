import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { GET } from "@/app/api/mentor/students/[id]/route";

describe("GET /api/mentor/students/[id]", () => {
  const prismaMock = getPrismaMock();
  const studentId = "student1";

  beforeEach(() => {
    // Set up authenticated mentor session
    mockAuthSession("MENTOR");

    // Mock mentor retrieval
    prismaMock.mentor.findFirst.mockResolvedValue({
      id: "mentor1",
      userId: "user123",
    } as any);

    // Mock student retrieval
    prismaMock.student.findUnique.mockResolvedValue({
      id: "student1",
      userId: "user1",
      learningInterests: ["WebDevelopment", "AiMl"],
      level: "INTERMEDIATE",
      user: {
        id: "user1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        image: null,
        intrest: "WebDevelopment",
        bio: "Student bio",
      },
      assignments: [
        {
          id: "assignment1",
          title: "React Assignment",
          description: "Build a React app",
          dueDate: new Date("2023-12-31"),
          status: "PENDING",
        },
      ],
    } as any);

    // Mock sessions retrieval
    prismaMock.mentorMeeting.findMany.mockResolvedValue([
      {
        id: "session1",
        title: "React Fundamentals",
        startTime: new Date("2023-12-15T14:00:00Z"),
        endTime: new Date("2023-12-15T15:00:00Z"),
        status: "SCHEDULED",
      },
    ] as any);
  });

  test("should return student details with assignments and sessions", async () => {
    const response = await GET({} as any, { params: { id: studentId } });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.student).toBeDefined();
    expect(data.student.id).toBe("student1");
    expect(data.student.name).toBe("John Doe");
    expect(data.student.email).toBe("john@example.com");
    expect(data.student.interest).toBe("WebDevelopment");
    expect(data.student.interests).toEqual(["WebDevelopment", "AiMl"]);
    expect(data.student.level).toBe("INTERMEDIATE");
    expect(data.student.assignments).toHaveLength(1);
    expect(data.student.sessions).toHaveLength(1);
  });

  test("should require authentication", async () => {
    // Mock unauthenticated session
    mockAuthSession(null);

    const response = await GET({} as any, { params: { id: studentId } });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  test("should require mentor role", async () => {
    // Mock student session
    mockAuthSession("STUDENT");

    const response = await GET({} as any, { params: { id: studentId } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Only mentors can access this endpoint");
  });

  test("should handle student not found", async () => {
    // Mock student not found
    prismaMock.student.findUnique.mockResolvedValue(null);

    const response = await GET({} as any, { params: { id: "nonexistent" } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Student not found");
  });
});
