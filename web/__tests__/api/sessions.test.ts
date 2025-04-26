import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import {
  GET as getMentorSessions,
  POST as createMentorSession,
} from "@/app/api/mentor/sessions/route";
import { GET as getStudentSessions } from "@/app/api/student/sessions/route";

describe("Sessions API", () => {
  const prismaMock = getPrismaMock();

  describe("GET /api/mentor/sessions", () => {
    beforeEach(() => {
      // Set up authenticated mentor session
      mockAuthSession("MENTOR");

      // Mock mentor retrieval
      prismaMock.mentor.findFirst.mockResolvedValue({
        id: "mentor1",
        userId: "user123",
        specialties: ["WebDevelopment", "AiMl"],
      } as any);

      // Mock meetings retrieval
      prismaMock.mentorMeeting.findMany.mockResolvedValue([
        {
          id: "session1",
          mentorId: "mentor1",
          title: "React Components",
          description: "Learn about React components",
          startTime: new Date("2025-05-01T10:00:00Z"),
          endTime: new Date("2025-05-01T11:00:00Z"),
          status: "SCHEDULED",
          category: "WebDevelopment",
          joinLink: "https://meet.example.com/1",
        },
        {
          id: "session2",
          mentorId: "mentor1",
          title: "API Integration",
          description: "Working with REST APIs",
          startTime: new Date("2025-05-10T14:00:00Z"),
          endTime: new Date("2025-05-10T15:30:00Z"),
          status: "SCHEDULED",
          category: "WebDevelopment",
          joinLink: "https://meet.example.com/2",
        },
      ] as any);

      // Mock count
      prismaMock.mentorMeeting.count.mockResolvedValue(2);
    });

    test("should return mentor sessions", async () => {
      const request = mockNextRequest({});
      const response = await getMentorSessions(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("meetings");
      expect(data).toHaveProperty("pagination");
      expect(data.meetings).toHaveLength(2);
      expect(data.meetings[0]).toHaveProperty("title", "React Components");
      expect(data.meetings[1]).toHaveProperty("title", "API Integration");
      expect(data.pagination).toHaveProperty("total", 2);
    });

    test("should require mentor authentication", async () => {
      // Mock student session
      mockAuthSession("STUDENT");

      const request = mockNextRequest({});
      const response = await getMentorSessions(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Only mentors can access this endpoint");
    });
  });

  describe("POST /api/mentor/sessions", () => {
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
      } as any);

      // Mock user retrieval for notification
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user123",
        firstName: "Jane",
        lastName: "Mentor",
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
          },
        },
      ] as any);

      // Mock notification creation
      prismaMock.notification.create.mockResolvedValue({} as any);
    });

    test("should create a new session and notify matching students", async () => {
      const request = mockNextRequest(newSession);
      const response = await createMentorSession(request);

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("id", "newSession1");
      expect(data).toHaveProperty("title", newSession.title);

      // Verify notifications were created for matching students
      expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "student123",
            type: "SESSION",
          }),
        })
      );
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

  describe("GET /api/student/sessions", () => {
    beforeEach(() => {
      // Set up authenticated student session
      mockAuthSession("STUDENT");

      // Mock student retrieval
      prismaMock.student.findFirst.mockResolvedValue({
        id: "student1",
        userId: "user456",
        learningInterests: ["WebDevelopment", "AiMl"],
        user: {
          intrest: "WebDevelopment",
        },
      } as any);

      // Mock meetings retrieval
      prismaMock.mentorMeeting.findMany.mockResolvedValue([
        {
          id: "session1",
          mentorId: "mentor1",
          title: "React Components",
          description: "Learn about React components",
          startTime: new Date("2025-05-01T10:00:00Z"),
          endTime: new Date("2025-05-01T11:00:00Z"),
          status: "SCHEDULED",
          category: "WebDevelopment",
          joinLink: "https://meet.example.com/1",
          mentorship: {
            user: {
              firstName: "Jane",
              lastName: "Mentor",
              image: null,
            },
          },
        },
      ] as any);

      // Mock count
      prismaMock.mentorMeeting.count.mockResolvedValue(1);
    });

    test("should return sessions matching student interests", async () => {
      const request = mockNextRequest({});
      const response = await getStudentSessions(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("meetings");
      expect(data).toHaveProperty("pagination");
      expect(data.meetings).toHaveLength(1);
      expect(data.meetings[0]).toHaveProperty("title", "React Components");
      expect(data.meetings[0]).toHaveProperty("mentor");
      expect(data.meetings[0].mentor).toHaveProperty("name", "Jane Mentor");
    });

    test("should require student authentication", async () => {
      // Mock mentor session
      mockAuthSession("MENTOR");

      const request = mockNextRequest({});
      const response = await getStudentSessions(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Only students can access this endpoint");
    });
  });
});
