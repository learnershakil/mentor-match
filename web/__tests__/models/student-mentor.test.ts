import { PrismaClient, SkillLevel } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { getPrismaMock } from "../mocks/prismaMock";

describe("Student and Mentor Models", () => {
  const prismaMock = getPrismaMock();

  // Mock student data
  const mockStudent = {
    id: "student123",
    userId: "user123",
    learningInterests: ["WebDevelopment", "AiMl"],
    level: "BEGINNER" as SkillLevel,
  };

  // Mock mentor data
  const mockMentor = {
    id: "mentor123",
    userId: "user456",
    specialties: ["WebDevelopment", "AppDevelopment"],
    company: "Tech Co",
    jobTitle: "Senior Developer",
    experience: 5,
    rating: 4.5,
    reviewCount: 10,
    availability: null,
  };

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe("Student Model", () => {
    test("should create a student", async () => {
      prismaMock.student.create.mockResolvedValue(mockStudent);

      const student = await prismaMock.student.create({
        data: {
          userId: "user123",
          learningInterests: ["WebDevelopment", "AiMl"],
          level: "BEGINNER",
        },
      });

      expect(student).toEqual(mockStudent);
      expect(prismaMock.student.create).toHaveBeenCalledTimes(1);
    });

    test("should find a student by user ID", async () => {
      prismaMock.student.findUnique.mockResolvedValue(mockStudent);

      const student = await prismaMock.student.findUnique({
        where: { userId: "user123" },
      });

      expect(student).toEqual(mockStudent);
      expect(prismaMock.student.findUnique).toHaveBeenCalledWith({
        where: { userId: "user123" },
      });
    });

    test("should update a student", async () => {
      const updatedStudent = {
        ...mockStudent,
        level: "INTERMEDIATE" as SkillLevel,
      };
      prismaMock.student.update.mockResolvedValue(updatedStudent);

      const student = await prismaMock.student.update({
        where: { id: "student123" },
        data: { level: "INTERMEDIATE" },
      });

      expect(student).toEqual(updatedStudent);
      expect(prismaMock.student.update).toHaveBeenCalledWith({
        where: { id: "student123" },
        data: { level: "INTERMEDIATE" },
      });
    });
  });

  describe("Mentor Model", () => {
    test("should create a mentor", async () => {
      prismaMock.mentor.create.mockResolvedValue(mockMentor);

      const mentor = await prismaMock.mentor.create({
        data: {
          userId: "user456",
          specialties: ["WebDevelopment", "AppDevelopment"],
          company: "Tech Co",
          jobTitle: "Senior Developer",
          experience: 5,
        },
      });

      expect(mentor).toEqual(mockMentor);
      expect(prismaMock.mentor.create).toHaveBeenCalledTimes(1);
    });

    test("should find a mentor by user ID", async () => {
      prismaMock.mentor.findUnique.mockResolvedValue(mockMentor);

      const mentor = await prismaMock.mentor.findUnique({
        where: { userId: "user456" },
      });

      expect(mentor).toEqual(mockMentor);
      expect(prismaMock.mentor.findUnique).toHaveBeenCalledWith({
        where: { userId: "user456" },
      });
    });

    test("should update a mentor", async () => {
      const updatedMentor = { ...mockMentor, rating: 4.8, reviewCount: 12 };
      prismaMock.mentor.update.mockResolvedValue(updatedMentor);

      const mentor = await prismaMock.mentor.update({
        where: { id: "mentor123" },
        data: { rating: 4.8, reviewCount: 12 },
      });

      expect(mentor).toEqual(updatedMentor);
      expect(prismaMock.mentor.update).toHaveBeenCalledWith({
        where: { id: "mentor123" },
        data: { rating: 4.8, reviewCount: 12 },
      });
    });
  });

  describe("Relationships", () => {
    const mockAssignment = {
      id: "assign123",
      title: "React Basics",
      description: "Create a React component",
      mentorId: "mentor123",
      studentId: "student123",
      dueDate: new Date(),
      status: "PENDING",
    };

    test("should get assignments for a student", async () => {
      prismaMock.assignment.findMany.mockResolvedValue([mockAssignment]);

      const assignments = await prismaMock.assignment.findMany({
        where: { studentId: "student123" },
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0]).toEqual(mockAssignment);
      expect(prismaMock.assignment.findMany).toHaveBeenCalledWith({
        where: { studentId: "student123" },
      });
    });

    test("should get assignments created by a mentor", async () => {
      prismaMock.assignment.findMany.mockResolvedValue([mockAssignment]);

      const assignments = await prismaMock.assignment.findMany({
        where: { mentorId: "mentor123" },
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0]).toEqual(mockAssignment);
      expect(prismaMock.assignment.findMany).toHaveBeenCalledWith({
        where: { mentorId: "mentor123" },
      });
    });
  });
});
