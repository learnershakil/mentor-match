import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all mentor meetings
export async function GET() {
  try {
    console.log("Fetching mentor meetings...");

    const meetings = await prisma.mentorMeeting.findMany({
      include: {
        mentorship: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    console.log(`Found ${meetings.length} meetings`);
    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      // @ts-ignore
      { error: "Failed to fetch meetings", details: error.message },
      { status: 500 }
    );
  }
}

// Create new meeting
// @ts-ignore
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.mentorId || !body.title || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create meeting
    const newMeeting = await prisma.mentorMeeting.create({
      data: {
        mentorId: body.mentorId,
        title: body.title,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        status: body.status || "SCHEDULED",
        notes: body.notes,
        recordingUrl: body.recordingUrl,
        category: body.category || "WebDevelopment",
        joinLink: body.joinLink,
      },
      include: {
        mentorship: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(newMeeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      // @ts-ignore
      { error: "Failed to create meeting", details: error.message },
      { status: 500 }
    );
  }
}
