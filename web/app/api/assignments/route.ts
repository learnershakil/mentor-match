import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssignmentStatus } from "@prisma/client";

// GET: Get assignments (with filtering options)
export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as AssignmentStatus | null;
    const studentId = searchParams.get("studentId");
    const search = searchParams.get("search");

    // Default limit and page
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    let whereClause: any = {};

    if (session.user.role === "MENTOR") {
      // Get the mentor ID for this user
      const mentor = await prisma.mentor.findFirst({
        where: { userId: session.user.id },
        select: { id: true, specialties: true },
      });

      if (!mentor) {
        return NextResponse.json(
          { error: "Mentor profile not found" },
          { status: 404 }
        );
      }

      whereClause.mentorId = mentor.id;

      // Add student filter if provided
      if (studentId) {
        whereClause.studentId = studentId;
      }

      // Add search filter if provided
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
    } else if (session.user.role === "STUDENT") {
      // Get the student ID for this user
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }

      whereClause.studentId = student.id;

      // Add search filter if provided
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
    } else {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Fetch assignments with pagination
    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  image: true,
                },
              },
            },
          },
          mentor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  image: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { dueDate: "desc" },
      }),
      prisma.assignment.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      assignments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST: Create a new assignment
export async function POST(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can create assignments
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can create assignments" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      studentId,
      dueDate,
      files = [],
      notifyStudent = true,
    } = body;

    // Validate required fields
    if (!title || !description || !studentId || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the mentor ID for the current user
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Check if the student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            intrest: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if the mentor has matching interests with the student
    const mentorSpecialties = mentor.specialties || [];
    const studentInterests = student.learningInterests || [];

    const hasMatchingInterest =
      mentorSpecialties.some(
        (specialty) =>
          studentInterests.includes(specialty) ||
          specialty === student.user.intrest
      ) || mentorSpecialties.includes(student.user.intrest);

    if (!hasMatchingInterest) {
      console.warn(`Creating assignment for student with non-matching interest. 
        Mentor specialties: ${mentorSpecialties.join(", ")}, 
        Student interests: ${[...studentInterests, student.user.intrest].join(
          ", "
        )}`);
    }

    // Parse the due date string to a Date object
    const parsedDueDate = new Date(dueDate);

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        mentorId: mentor.id,
        studentId,
        dueDate: parsedDueDate,
        files,
        status: "PENDING",
      },
    });

    // Create a notification for the student if requested
    if (notifyStudent) {
      const mentorName = `${mentor.user.firstName} ${mentor.user.lastName}`;

      await prisma.notification.create({
        data: {
          userId: student.user.id,
          title: "New Assignment",
          content: `${mentorName} has assigned you a new task: "${title}". Due date: ${parsedDueDate.toLocaleDateString()}`,
          type: "ASSIGNMENT",
        },
      });
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment", details: String(error) },
      { status: 500 }
    );
  }
}
