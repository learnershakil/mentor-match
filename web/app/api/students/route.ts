import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can view the list of students
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can access this endpoint" },
        { status: 403 }
      );
    }

    // Get the mentor ID for the current user
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const interest = searchParams.get("interest") || undefined;
    const level = searchParams.get("level") || undefined;

    // Build where clause
    let whereClause: any = {};

    // Add search term if provided
    if (search) {
      whereClause.user = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Add interest filter if provided
    if (interest) {
      whereClause.learningInterests = {
        has: interest,
      };
    }

    // Add skill level filter if provided
    if (level) {
      whereClause.level = level;
    }

    // Fetch students
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            intrest: true,
          },
        },
        assignments: {
          where: {
            mentorId: mentor.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    // Format the response
    const formattedStudents = students.map((student) => ({
      id: student.id,
      userId: student.userId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      image: student.user.image,
      interest: student.user.intrest,
      level: student.level,
      hasAssignments: student.assignments.length > 0,
      lastAssignment: student.assignments[0] || null,
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
