import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { POST as createMentorSession } from "@/app/api/mentor/sessions/route";

describe("POST /api/mentor/sessions", () => {
  const prismaMock = getPrismaMock();

  const newSession = {
    title: "New Session",
    description: "Test session description",
    startTime: "2025-06-01T10:00:00Z",
    endTime: "2025-06-01T11:00:00Z",
    category: "WebDevelopment",
    joinLink: "https://meet.example.com/new",
  };

  beforeEach(() => {
    // Set up authenticated mentor session
    mockAuthSession("MENTOR");

    // Mock mentor retrieval
    prismaMock.mentor.findFirst.mockResolvedValue({
      id: "mentor1",
      userId: "user123",
      specialties: ["WebDevelopment", "AiMl"],
      user: {
        firstName: "Jane",
        lastName: "Mentor",
      },
    } as any);

    // Mock session creation
    prismaMock.mentorMeeting.create.mockResolvedValue({
      id: "newSession1",
      ...newSession,
      startTime: new Date(newSession.startTime),
      endTime: new Date(newSession.endTime),
      mentorId: "mentor1",
      status: "SCHEDULED",
    } as any);

    // Mock matching students
    prismaMock.student.findMany.mockResolvedValue([
      {
        id: "student1",
        userId: "student123",
        learningInterests: ["WebDevelopment"],
        user: {
          id: "student123",
          firstName: "John",
          lastName: "Student",
          email: "john@example.com",
        },
      },
      {
        id: "student2",
        userId: "student456",
        learningInterests: ["WebDevelopment", "AiMl"],
        user: {
          id: "student456",
          firstName: "Jane",
          lastName: "Student",
          email: "jane@example.com",
        },
      },
    ] as any);

    // Mock notification creation
    prismaMock.notification.create.mockResolvedValue({
      id: "notification1",
      userId: "student123",
      title: "New Session Available",
      content: expect.any(String),
      type: "SESSION",
      isRead: false,
      createdAt: new Date(),
    } as any);
  });

  test("should create a new session and notify matching students", async () => {
    const request = mockNextRequest(newSession);
    const response = await createMentorSession(request);

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty("session.id", "newSession1");
    expect(data).toHaveProperty("notifiedStudents", 2);

    // Verify notifications were created for both matching students
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);

    // Check first notification
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "student123",
          title: "New Session Available",
          type: "SESSION",
        }),
      })
    );

    // Check second notification
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "student456",
          title: "New Session Available",
          type: "SESSION",
        }),
      })
    );
  });

  test("should handle case with no matching students", async () => {
    // Mock empty students result
    prismaMock.student.findMany.mockResolvedValueOnce([]);

    const request = mockNextRequest(newSession);
    const response = await createMentorSession(request);

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty("session.id", "newSession1");
    expect(data).toHaveProperty("notifiedStudents", 0);

    // No notifications should be created
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });

  test("should require mentor authentication", async () => {
    // Mock student session
    mockAuthSession("STUDENT");

    const request = mockNextRequest(newSession);
    const response = await createMentorSession(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Only mentors can create sessions");
  });

  test("should validate required fields", async () => {
    const request = mockNextRequest({ title: "Missing Fields" });
    const response = await createMentorSession(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Missing required fields");
  });
});
