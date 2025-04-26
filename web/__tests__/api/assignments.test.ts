import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { GET, POST } from "@/app/api/assignments/route";
import {
  GET as GetSingleAssignment,
  PUT,
  DELETE,
} from "@/app/api/assignments/[id]/route";

describe("Assignments API", () => {
  const prismaMock = getPrismaMock();

  // Mock assignments data
  const mockAssignments = [
    {
      id: "assign1",
      title: "React Basics",
      description: "Create a React component",
      mentorId: "mentor1",
      studentId: "student1",
      dueDate: new Date("2025-05-15"),
      status: "PENDING",
      files: [],
    },
    {
      id: "assign2",
      title: "Node.js API",
      description: "Build a RESTful API",
      mentorId: "mentor1",
      studentId: "student2",
      dueDate: new Date("2025-05-20"),
      status: "SUBMITTED",
      submittedAt: new Date("2025-05-18"),
      files: ["https://github.com/student/project"],
    },
  ];

  beforeEach(() => {
    // Set up authenticated mentor session for testing
    mockAuthSession("MENTOR");

    // Mock mentor retrieval
    prismaMock.mentor.findFirst.mockResolvedValue({
      id: "mentor1",
      userId: "user123",
      specialties: ["WebDevelopment"],
      rating: 4.5,
      reviewCount: 10,
      // ... other mentor fields
    } as any);

    // Mock student retrieval
    prismaMock.student.findUnique.mockResolvedValue({
      id: "student1",
      userId: "student123",
      learningInterests: ["WebDevelopment"],
      level: "BEGINNER",
    } as any);

    // Mock assignments retrieval
    prismaMock.assignment.findMany.mockResolvedValue(mockAssignments);
    prismaMock.assignment.count.mockResolvedValue(mockAssignments.length);

    // Mock single assignment retrieval
    prismaMock.assignment.findUnique.mockResolvedValue(mockAssignments[0]);

    // Mock notification creation
    prismaMock.notification.create.mockResolvedValue({
      id: "notification1",
      userId: "student123",
      title: "New Assignment",
      content: "You have a new assignment: React Basics",
      type: "ASSIGNMENT",
      isRead: false,
      createdAt: new Date(),
    });
  });

  describe("GET /api/assignments", () => {
    test("should return assignments for a mentor", async () => {
      const request = mockNextRequest({});
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("assignments");
      expect(data).toHaveProperty("pagination");
      expect(data.assignments).toHaveLength(2);
    });

    test("should return assignments for a student", async () => {
      // Set up student session
      mockAuthSession("STUDENT");
      prismaMock.student.findFirst.mockResolvedValue({
        id: "student1",
        userId: "user123",
        learningInterests: ["WebDevelopment"],
        level: "BEGINNER",
      } as any);

      prismaMock.assignment.findMany.mockResolvedValue([mockAssignments[0]]);
      prismaMock.assignment.count.mockResolvedValue(1);

      const request = mockNextRequest({});
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.assignments).toHaveLength(1);
    });

    test("should filter assignments by status", async () => {
      const request = mockNextRequest({});
      // Mock URL with search params
      Object.defineProperty(request, "url", {
        value: "http://localhost:3000/api/assignments?status=SUBMITTED",
      });

      // Mock filtered assignments
      prismaMock.assignment.findMany.mockResolvedValueOnce([
        mockAssignments[1],
      ]);
      prismaMock.assignment.count.mockResolvedValueOnce(1);

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.assignments).toHaveLength(1);
      expect(data.assignments[0].status).toBe("SUBMITTED");
    });
  });

  describe("POST /api/assignments", () => {
    const newAssignment = {
      title: "New Assignment",
      description: "Create a new project",
      studentId: "student1",
      dueDate: "2025-06-01T00:00:00.000Z",
      files: ["https://github.com/mentor/starter-code"],
    };

    test("should create a new assignment", async () => {
      // Mock assignment creation
      prismaMock.assignment.create.mockResolvedValue({
        id: "assign3",
        ...newAssignment,
        mentorId: "mentor1",
        status: "PENDING",
        dueDate: new Date(newAssignment.dueDate),
      } as any);

      // Mock student retrieval for notification
      prismaMock.student.findUnique.mockResolvedValue({
        id: "student1",
        userId: "student123",
        learningInterests: ["WebDevelopment"],
        level: "BEGINNER",
        user: {
          id: "student123",
          firstName: "John",
          lastName: "Doe",
        },
      } as any);

      const request = mockNextRequest(newAssignment);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("id", "assign3");
      expect(data).toHaveProperty("title", newAssignment.title);

      // Verify notification was created
      expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "student123",
          title: "New Assignment",
          content: `You have a new assignment: ${newAssignment.title}`,
          type: "ASSIGNMENT",
        },
      });
    });

    test("should validate required fields", async () => {
      const invalidData = {
        title: "Missing Fields",
        // Missing description, studentId, dueDate
      };

      const request = mockNextRequest(invalidData);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    test("should verify student exists", async () => {
      // Mock student not found
      prismaMock.student.findUnique.mockResolvedValueOnce(null);

      const request = mockNextRequest(newAssignment);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Student not found");
    });

    test("should restrict assignment creation to mentors", async () => {
      // Set up student session
      mockAuthSession("STUDENT");

      const request = mockNextRequest(newAssignment);
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Only mentors can create assignments");
    });
  });

  describe("GET /api/assignments/[id]", () => {
    test("should get a single assignment by ID", async () => {
      const params = { id: "assign1" };
      const request = mockNextRequest({});

      const response = await GetSingleAssignment(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("id", "assign1");
      expect(data).toHaveProperty("title", "React Basics");
    });

    test("should return 404 if assignment not found", async () => {
      // Mock assignment not found
      prismaMock.assignment.findUnique.mockResolvedValueOnce(null);

      const params = { id: "nonexistent" };
      const request = mockNextRequest({});

      const response = await GetSingleAssignment(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Assignment not found");
    });

    test("should verify mentor access permission", async () => {
      // Mock different mentor ID
      prismaMock.mentor.findFirst.mockResolvedValueOnce({
        id: "mentor2", // Different from the assignment's mentorId
        userId: "user123",
      } as any);

      const params = { id: "assign1" };
      const request = mockNextRequest({});

      const response = await GetSingleAssignment(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("permission");
    });
  });

  describe("PUT /api/assignments/[id]", () => {
    const updateData = {
      title: "Updated Assignment",
      description: "Updated description",
      dueDate: "2025-06-10T00:00:00.000Z",
    };

    test("should update an assignment as a mentor", async () => {
      // Mock successful update
      prismaMock.assignment.update.mockResolvedValue({
        ...mockAssignments[0],
        ...updateData,
        dueDate: new Date(updateData.dueDate),
      } as any);

      const params = { id: "assign1" };
      const request = mockNextRequest(updateData);

      const response = await PUT(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("title", updateData.title);
    });

    test("should allow student to submit an assignment", async () => {
      // Set up student session
      mockAuthSession("STUDENT");
      prismaMock.student.findFirst.mockResolvedValue({
        id: "student1",
        userId: "user123",
      } as any);

      const submissionData = {
        files: ["https://github.com/student/submission"],
        Comments: "Here is my submission",
      };

      // Mock successful submission
      prismaMock.assignment.update.mockResolvedValue({
        ...mockAssignments[0],
        status: "SUBMITTED",
        submittedAt: new Date(),
        ...submissionData,
      } as any);

      const params = { id: "assign1" };
      const request = mockNextRequest(submissionData);

      const response = await PUT(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("status", "SUBMITTED");
      expect(data).toHaveProperty("files");
      expect(data).toHaveProperty("submittedAt");

      // Verify notification was created for mentor
      expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("DELETE /api/assignments/[id]", () => {
    test("should delete an assignment", async () => {
      // Mock successful deletion
      prismaMock.assignment.delete.mockResolvedValue(mockAssignments[0] as any);

      const params = { id: "assign1" };
      const request = mockNextRequest({});

      const response = await DELETE(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("success", true);
    });

    test("should verify mentor is the owner", async () => {
      // Mock different mentor ID
      prismaMock.mentor.findFirst.mockResolvedValueOnce({
        id: "mentor2", // Different from the assignment's mentorId
        userId: "user123",
      } as any);

      const params = { id: "assign1" };
      const request = mockNextRequest({});

      const response = await DELETE(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("permission");
    });

    test("should return 404 if assignment not found", async () => {
      // Mock assignment not found
      prismaMock.assignment.findUnique.mockResolvedValueOnce(null);

      const params = { id: "nonexistent" };
      const request = mockNextRequest({});

      const response = await DELETE(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Assignment not found");
    });
  });

  describe("GET /api/assignments/students", () => {
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
        },
      ] as any);
    });

    test("should return students with matching interests", async () => {
      // Import the GET function from the new endpoint
      const { GET } = require("@/app/api/assignments/students/route");

      const request = mockNextRequest({});
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("students");
      expect(data.students).toHaveLength(2);
      expect(data.students[0]).toHaveProperty("name", "John Doe");
      expect(data.students[0]).toHaveProperty("interest", "WebDevelopment");
      expect(data.students[1]).toHaveProperty("name", "Jane Smith");
      expect(data.students[1]).toHaveProperty("interest", "AiMl");
    });

    test("should return empty array if no matching students", async () => {
      // Mock empty students result
      prismaMock.student.findMany.mockResolvedValueOnce([]);

      // Import the GET function from the new endpoint
      const { GET } = require("@/app/api/assignments/students/route");

      const request = mockNextRequest({});
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("students");
      expect(data.students).toHaveLength(0);
    });
  });
});
