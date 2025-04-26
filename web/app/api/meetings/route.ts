import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET all meetings with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);

    // Pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filter parameters
    const mentorId = url.searchParams.get("mentorId");
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const upcoming = url.searchParams.get("upcoming") === "true";

    // Build filter conditions
    const where: any = {};

    if (mentorId) {
      where.mentorId = mentorId;
    } else if (session.user.role === "MENTOR") {
      // Get mentor ID for the current user
      const mentor = await prisma.mentor.findUnique({
        where: { userId: session.user.id },
      });

      if (mentor) {
        where.mentorId = mentor.id;
      }
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (upcoming) {
      where.startTime = {
        gte: new Date(),
      };
    }

    // Query meetings with filters
    const [meetings, totalCount] = await Promise.all([
      prisma.mentorMeeting.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: {
          startTime: "asc",
        },
      }),
      prisma.mentorMeeting.count({ where }),
    ]);

    return NextResponse.json({
      meetings,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - create a new meeting
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, startTime, endTime, category, joinLink } = body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get mentor ID for the current user
    const mentor = await prisma.mentor.findUnique({
      where: { userId: session.user.id },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Create meeting
    const meeting = await prisma.mentorMeeting.create({
      data: {
        mentorId: mentor.id,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        category: category || "WebDevelopment",
        joinLink,
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
