import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Interest, MeetingStatus } from "@prisma/client";

// Helper function to validate if a string is a valid Interest enum value
function isValidInterest(interest: string): interest is Interest {
  return Object.values(Interest).includes(interest as Interest);
}

// GET: Get student sessions
export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can access this endpoint" },
        { status: 403 }
      );
    }

    // Get the student ID
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as MeetingStatus | null;
    const upcoming = searchParams.get("upcoming") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (upcoming) {
      whereClause.startTime = {
        gte: new Date(),
      };
    }

    // Get student interests - filter only valid Interest enum values
    const validInterests: Interest[] = [];

    // Add user's primary interest if it exists and is valid
    if (student.user.intrest) {
      validInterests.push(student.user.intrest);
    }

    // Add additional learning interests if they are valid enum values
    if (student.learningInterests && student.learningInterests.length > 0) {
      student.learningInterests.forEach((interest) => {
        if (
          isValidInterest(interest) &&
          !validInterests.includes(interest as Interest)
        ) {
          validInterests.push(interest as Interest);
        }
      });
    }

    // Only apply category filter if there are valid interests
    if (validInterests.length > 0) {
      whereClause.category = {
        in: validInterests,
      };
    }

    // Fetch sessions with pagination
    const [meetings, totalCount] = await Promise.all([
      prisma.mentorMeeting.findMany({
        where: whereClause,
        orderBy: {
          startTime: "asc",
        },
        include: {
          // @ts-ignore
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
      }),
      prisma.mentorMeeting.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      meetings,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sessions for student:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
