import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Interest, MeetingStatus } from "@prisma/client";

// GET: Get upcoming sessions for both students and mentors
export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // For mentors, simply show their own meetings
    if (userRole === "MENTOR") {
      const mentor = await prisma.mentor.findFirst({
        where: { userId },
      });

      if (!mentor) {
        return NextResponse.json(
          { error: "Mentor profile not found" },
          { status: 404 }
        );
      }

      const meetings = await prisma.mentorMeeting.findMany({
        where: {
          mentorId: mentor.id,
          status: "SCHEDULED",
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          startTime: "asc",
        },
        include: {
          mentorship: {
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
        // Don't use select, as we want to include all fields from MentorMeeting
        take: limit,
      });

      return NextResponse.json({
        meetings,
      });
    }
    // For students, only show meetings matching their interests
    else if (userRole === "STUDENT") {
      // Get the student and their user details
      const student = await prisma.student.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              intrest: true,
            },
          },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }

      // Collect all valid interests for the student (both from user.intrest and student.learningInterests)
      const userInterests: Interest[] = [];

      // Add primary interest
      if (student.user.intrest) {
        userInterests.push(student.user.intrest);
      }

      // Filter and add valid learning interests
      if (student.learningInterests) {
        // Only add interests that match the Interest enum values
        const validInterests = student.learningInterests.filter(
          (interest): interest is Interest =>
            Object.values(Interest).includes(interest as Interest)
        );

        // Add unique interests to our array
        validInterests.forEach((interest) => {
          if (!userInterests.includes(interest)) {
            userInterests.push(interest);
          }
        });
      }

      // If no valid interests, return empty list
      if (userInterests.length === 0) {
        return NextResponse.json({
          meetings: [],
        });
      }

      // Get meetings matching any of the user's interests
      const meetings = await prisma.mentorMeeting.findMany({
        where: {
          status: "SCHEDULED",
          startTime: {
            gte: new Date(),
          },
          category: {
            in: userInterests,
          },
        },
        orderBy: {
          startTime: "asc",
        },
        include: {
          mentorship: {
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
        // Don't use select, as we want to include all fields from MentorMeeting
        take: limit,
      });

      return NextResponse.json({
        meetings,
      });
    }

    // If not a student or mentor, return error
    return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
  } catch (error) {
    console.error("Error fetching upcoming sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming sessions", details: String(error) },
      { status: 500 }
    );
  }
}
