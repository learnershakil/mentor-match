import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MeetingStatus } from "@prisma/client";

// GET: Get mentor sessions
export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can access this endpoint" },
        { status: 403 }
      );
    }

    // Get the mentor ID
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as MeetingStatus | null;
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = {
      mentorId: mentor.id,
    };

    if (status) {
      whereClause.status = status;
    }

    // Fetch sessions with pagination
    const [meetings, totalCount] = await Promise.all([
      prisma.mentorMeeting.findMany({
        where: whereClause,
        orderBy: {
          startTime: "asc",
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
    console.error("Error fetching mentor sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST: Create a new session
export async function POST(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can create sessions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, startTime, endTime, category, joinLink } = body;

    // Validate required fields
    if (!title || !startTime || !endTime || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get mentor ID
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        specialties: true,
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

    // Create the session
    const newMeeting = await prisma.mentorMeeting.create({
      data: {
        mentorId: mentor.id,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        category,
        joinLink,
        status: "SCHEDULED",
      },
    });

    // Find students with matching interests to notify
    const matchingStudents = await prisma.student.findMany({
      where: {
        OR: [
          { learningInterests: { has: category } },
          { user: { intrest: category } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `Found ${matchingStudents.length} students with matching interests for notification`
    );

    // Create notifications for matching students
    const mentorName = `${mentor.user.firstName} ${mentor.user.lastName}`;
    const sessionDate = new Date(startTime).toLocaleDateString();
    const sessionTime = `${new Date(startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${new Date(endTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    if (matchingStudents.length > 0) {
      const notificationPromises = matchingStudents.map((student) =>
        prisma.notification.create({
          data: {
            userId: student.user.id,
            title: "New Session Available",
            content: `${mentorName} has scheduled a new ${category
              .replace(/([A-Z])/g, " $1")
              .trim()} session: "${title}" on ${sessionDate} at ${sessionTime}`,
            type: "SESSION",
          },
        })
      );

      await Promise.all(notificationPromises);
      console.log(
        `Sent ${notificationPromises.length} notifications to students`
      );
    }

    return NextResponse.json(
      {
        message: "Session created successfully",
        session: newMeeting,
        notifiedStudents: matchingStudents.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session", details: String(error) },
      { status: 500 }
    );
  }
}
