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

    // Only mentors can access student list for assignments
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

    // Get students with matching interests to mentor's specialties
    const students = await prisma.student.findMany({
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
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
