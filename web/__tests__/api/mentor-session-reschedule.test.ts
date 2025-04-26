import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { PUT } from "@/app/api/mentor/sessions/[id]/reschedule/route";

describe("PUT /api/mentor/sessions/[id]/reschedule", () => {
  const prismaMock = getPrismaMock();
  const sessionId = "session1";

  beforeEach(() => {
    // Set up authenticated mentor session
    mockAuthSession("MENTOR");

    // Mock mentor retrieval
    prismaMock.mentor.findFirst.mockResolvedValue({
      id: "mentor1",
      userId: "user123",
      user: {
        firstName: "Jane",
        lastName: "Mentor",
      },
    } as any);

    // Mock session retrieval
    prismaMock.mentorMeeting.findUnique.mockResolvedValue({
      id: sessionId,
      mentorId: "mentor1",
      title: "React Components",
      description: "Learn about React components",
      startTime: new Date("2025-05-01T10:00:00Z"),
      endTime: new Date("2025-05-01T11:00:00Z"),
      status: "SCHEDULED",
      category: "WebDevelopment",
      joinLink: "https://meet.example.com/1",
      mentorship: {
        userId: "mentor1",
      },
    } as any);

    // Mock session update
    prismaMock.mentorMeeting.update.mockResolvedValue({
      id: sessionId,
      mentorId: "mentor1",
      title: "React Components",
      description: "Learn about React components",
      startTime: new Date("2025-05-10T14:00:00Z"),
      endTime: new Date("2025-05-10T15:00:00Z"),
      status: "SCHEDULED",
      category: "WebDevelopment",
      joinLink: "https://meet.example.com/1",
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
        },
      },
      {
        id: "student2",
        userId: "student456",
        learningInterests: ["WebDevelopment"],
        user: {
          id: "student456",
          firstName: "Jane",
          lastName: "Student",
        },
      },
    ] as any);

    // Mock notification creation
    prismaMock.notification.create.mockResolvedValue({
      id: "notification1",
      userId: "student123",
      title: "Session Rescheduled",
      content: expect.any(String),
      type: "SESSION",
      isRead: false,
      createdAt: new Date(),
    } as any);
  });

  test("should successfully reschedule a session", async () => {
    const newTimes = {
      startTime: "2025-05-10T14:00:00Z",
      endTime: "2025-05-10T15:00:00Z",
      notifyStudents: true,
    };

    const request = mockNextRequest(newTimes);
    const response = await PUT(request, { params: { id: sessionId } });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.message).toBe("Session rescheduled successfully");
    expect(data.session).toBeDefined();
    expect(data.notifiedStudents).toBe(true);

    // Verify session was updated
    expect(prismaMock.mentorMeeting.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: {
        startTime: new Date(newTimes.startTime),
        endTime: new Date(newTimes.endTime),
        status: "SCHEDULED",
      },
    });

    // Verify notifications were sent to both students
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);
  });

  test("should reschedule without notifications if notifyStudents is false", async () => {
    const newTimes = {
      startTime: "2025-05-10T14:00:00Z",
      endTime: "2025-05-10T15:00:00Z",
      notifyStudents: false,
    };

    const request = mockNextRequest(newTimes);
    const response = await PUT(request, { params: { id: sessionId } });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.message).toBe("Session rescheduled successfully");
    expect(data.session).toBeDefined();
    expect(data.notifiedStudents).toBe(false);

    // Verify session was updated
    expect(prismaMock.mentorMeeting.update).toHaveBeenCalled();

    // Verify no notifications were sent
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });

  test("should require mentor authentication", async () => {
    // Mock student session
    mockAuthSession("STUDENT");

    const newTimes = {
      startTime: "2025-05-10T14:00:00Z",
      endTime: "2025-05-10T15:00:00Z",
    };

    const request = mockNextRequest(newTimes);
    const response = await PUT(request, { params: { id: sessionId } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Only mentors can reschedule sessions");
  });

  test("should validate session ownership", async () => {
    // Mock a session that belongs to a different mentor
    prismaMock.mentorMeeting.findUnique.mockResolvedValueOnce({
      id: sessionId,
      mentorId: "mentor2", // Different mentor ID
      title: "React Components",
      status: "SCHEDULED",
      category: "WebDevelopment",
      mentorship: {
        userId: "mentor2",
      },
    } as any);

    const newTimes = {
      startTime: "2025-05-10T14:00:00Z",
      endTime: "2025-05-10T15:00:00Z",
    };

    const request = mockNextRequest(newTimes);
    const response = await PUT(request, { params: { id: sessionId } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe(
      "You do not have permission to reschedule this session"
    );
  });

  test("should validate required fields", async () => {
    // Missing end time
    const invalidData = {
      startTime: "2025-05-10T14:00:00Z",
      // endTime is missing
    };

    const request = mockNextRequest(invalidData);
    const response = await PUT(request, { params: { id: sessionId } });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Start time and end time are required");
  });

  test("should handle missing sessionId gracefully", async () => {
    const newTimes = {
      startTime: "2025-05-10T14:00:00Z",
      endTime: "2025-05-10T15:00:00Z",
    };

    const request = mockNextRequest(newTimes);
    // Pass empty id to simulate missing id parameter
    const response = await PUT(request, { params: { id: "" } });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Session ID is required");
  });

  test("should handle notification errors gracefully", async () => {
    // Setup a scenario where notifications fail but session update succeeds
    prismaMock.student.findMany.mockRejectedValueOnce(
      new Error("Database error")
    );

    const newTimes = {
      startTime: "2025-05-10T14:00:00Z",
      endTime: "2025-05-10T15:00:00Z",
      notifyStudents: true,
    };

    const request = mockNextRequest(newTimes);
    const response = await PUT(request, { params: { id: sessionId } });

    // The session should still be updated successfully
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Session rescheduled successfully");
    expect(data.session).toBeDefined();
  });
});
