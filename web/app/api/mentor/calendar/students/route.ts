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

    // Only mentors can access student list for calendar
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can access this endpoint" },
        { status: 403 }
      );
    }

    // Get the mentor profile to find the specialties
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        specialties: true,
        user: {
          select: {
            intrest: true,
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

    // Combine mentor specialties and main interest
    const mentorInterests = [...mentor.specialties, mentor.user.intrest].filter(
      (value, index, self) => self.indexOf(value) === index
    ); // Deduplicate

    // First try to get students with matching interests
    let students = await prisma.student.findMany({
      where: {
        OR: [
          {
            learningInterests: {
              hasSome: mentorInterests,
            },
          },
          {
            user: {
              intrest: {
                in: mentorInterests,
              },
            },
          },
        ],
      },
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
      },
    });

    // If no students found with matching interests, get all students
    if (students.length === 0) {
      console.log(
        "No students with matching interests found, returning all students"
      );
      students = await prisma.student.findMany({
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
        },
        take: 20, // Limit to 20 students if returning all
      });
    }

    // Format the student data for easier consumption in the frontend
    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      image: student.user.image,
      interests: [...student.learningInterests, student.user.intrest].filter(
        (value, index, self) => self.indexOf(value) === index
      ),
      level: student.level,
      userId: student.user.id,
    }));

    return NextResponse.json({
      students: formattedStudents,
      mentorInterests,
      // Add flag to indicate if we're showing all students or just matching ones
      isFilteredByInterest: students.length > 0 && students.length < 20,
    });
  } catch (error) {
    console.error("Error fetching students for calendar:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch students",
        details: String(error),
        // Return empty array to prevent UI from getting stuck in loading state
        students: [],
      },
      { status: 500 }
    );
  }
}
