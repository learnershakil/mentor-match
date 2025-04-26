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

    // Get the mentor ID and specialties for the current user
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        specialties: true,
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Get mentor's primary interest
    const mentorUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { intrest: true },
    });

    // Query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const interest = searchParams.get("interest") || undefined;
    const level = searchParams.get("level") || undefined;

    // Build where clause
    const whereClause: any = {
      OR: [],
    };

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

    // Add filtering conditions
    const interestConditions = [];

    // Add filter for specific interest if provided
    if (interest) {
      interestConditions.push({
        learningInterests: {
          has: interest,
        },
      });
      interestConditions.push({
        user: {
          intrest: interest,
        },
      });
    }
    // Otherwise, match with mentor's specialties and interest
    else {
      if (mentor.specialties && mentor.specialties.length > 0) {
        interestConditions.push({
          learningInterests: {
            hasSome: mentor.specialties,
          },
        });
      }

      if (mentorUser?.intrest) {
        interestConditions.push({
          learningInterests: {
            has: mentorUser.intrest,
          },
        });
        interestConditions.push({
          user: {
            intrest: mentorUser.intrest,
          },
        });
      }
    }

    whereClause.OR = interestConditions;

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
        // Fix: Use a simpler approach for assignments
        assignments: {
          where: {
            mentorId: mentor.id,
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
      userId: student.user.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      image: student.user.image,
      interest: student.user.intrest,
      interests: student.learningInterests,
      level: student.level,
      hasAssignments: student.assignments.length > 0,
    }));

    return NextResponse.json({
      students: formattedStudents,
      totalStudents: formattedStudents.length,
    });
  } catch (error) {
    console.error("Error fetching mentor's students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students", details: String(error) },
      { status: 500 }
    );
  }
}
