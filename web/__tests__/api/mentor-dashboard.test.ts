import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { GET } from "@/app/api/mentor/dashboard/route";

describe("GET /api/mentor/dashboard", () => {
  const prismaMock = getPrismaMock();

  beforeEach(() => {
    // Set up authenticated mentor session for testing
    mockAuthSession("MENTOR");

    // Mock mentor retrieval
    prismaMock.mentor.findFirst.mockResolvedValue({
      id: "mentor1",
      userId: "user123",
      specialties: ["WebDevelopment", "AiMl"],
      rating: 4.8,
      reviewCount: 15,
    } as any);

    // Mock user data
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user123",
      firstName: "Jane",
      lastName: "Mentor",
      email: "jane@example.com",
      role: "MENTOR",
      intrest: "WebDevelopment",
      image: "/avatar.jpg",
    } as any);

    // Mock the counts
    prismaMock.student.count.mockResolvedValue(5); // 5 students with matching interests
    prismaMock.mentorMeeting.count.mockResolvedValue(12);
    prismaMock.assignment.count.mockResolvedValue(8);

    // Mock upcoming sessions
    prismaMock.mentorMeeting.findMany.mockResolvedValue([
      {
        id: "session1",
        title: "React Fundamentals",
        mentorId: "mentor1",
        startTime: new Date("2025-01-01T10:00:00Z"),
        endTime: new Date("2025-01-01T11:00:00Z"),
        status: "SCHEDULED",
        joinLink: "https://meet.example.com/123",
        mentorship: {
          user: {
            firstName: "John",
            lastName: "Doe",
            image: "/student1.jpg",
          },
        },
      },
    ] as any);

    // Mock recent assignments
    prismaMock.assignment.findMany.mockResolvedValue([
      {
        id: "assign1",
        title: "Build a React Component",
        mentorId: "mentor1",
        dueDate: new Date("2025-01-10"),
        status: "PENDING",
        student: {
          user: {
            firstName: "John",
            lastName: "Doe",
            image: "/student1.jpg",
          },
        },
      },
    ] as any);

    // Mock students with matching interests
    prismaMock.student.findMany.mockResolvedValue([
      {
        id: "student1",
        userId: "student123",
        learningInterests: ["WebDevelopment"],
        level: "BEGINNER",
        user: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          image: "/student1.jpg",
          intrest: "WebDevelopment",
        },
      },
    ] as any);
  });

  test("should return dashboard data for a mentor", async () => {
    const request = mockNextRequest({});
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty("mentor");
    expect(data).toHaveProperty("stats");
    expect(data).toHaveProperty("upcomingSessions");
    expect(data).toHaveProperty("recentAssignments");
    expect(data).toHaveProperty("students");

    expect(data.mentor.name).toBe("Jane Mentor");
    expect(data.stats.totalStudents).toBe(5); // Now shows only students with matching interests
    expect(data.stats.totalSessions).toBe(12);
    expect(data.stats.totalAssignments).toBe(8);
    expect(data.stats.rating).toBe(4.8);

    expect(data.upcomingSessions).toHaveLength(1);
    expect(data.upcomingSessions[0].title).toBe("React Fundamentals");

    expect(data.recentAssignments).toHaveLength(1);
    expect(data.recentAssignments[0].title).toBe("Build a React Component");

    expect(data.students).toHaveLength(1);
    expect(data.students[0].name).toBe("John Doe");
    expect(data.students[0].interest).toBe("WebDevelopment");

    // Additional assertion to ensure we have assignments
    expect(data.recentAssignments).toBeDefined();
    expect(data.recentAssignments.length).toBeGreaterThan(0);
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
    expect(data.error).toBe("Failed to fetch dashboard data");
  });
});
