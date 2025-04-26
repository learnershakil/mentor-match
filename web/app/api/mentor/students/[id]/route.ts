import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can view student details
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can access this endpoint" },
        { status: 403 }
      );
    }

    // Get the mentor ID
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Find the student by ID
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            intrest: true,
            bio: true,
          },
        },
        // Get assignments assigned by this mentor to this student
        assignments: {
          where: {
            mentorId: mentor.id,
          },
          orderBy: {
            dueDate: "desc",
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get sessions between this mentor and student
    const sessions = await prisma.mentorMeeting.findMany({
      where: {
        mentorId: mentor.id,
        // We can add studentId here once you update your schema to include it
      },
      orderBy: {
        startTime: "desc",
      },
    });

    // Format the response
    const formattedStudent = {
      id: student.id,
      userId: student.user.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      image: student.user.image,
      interest: student.user.intrest,
      interests: student.learningInterests,
      level: student.level,
      bio: student.user.bio,
      assignments: student.assignments,
      sessions: sessions,
    };

    return NextResponse.json({ student: formattedStudent });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}
