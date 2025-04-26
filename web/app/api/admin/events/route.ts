import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all events
export async function GET() {
  try {
    console.log("Fetching events...");

    const events = await prisma.events.findMany({
      include: {
        student: {
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
        mentor: {
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

    console.log(`Found ${events.length} events`);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      // @ts-ignore
      { error: "Failed to fetch events", details: error.message },
      { status: 500 }
    );
  }
}

// Create new event
// @ts-ignore
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.studentId || !body.mentorId || !body.title || !body.startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create event
    const newEvent = await prisma.events.create({
      data: {
        studentId: body.studentId,
        mentorId: body.mentorId,
        title: body.title,
        description: body.description || "",
        startTime: new Date(body.startTime),
        eventType: body.eventType,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        mentor: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      // @ts-ignore
      { error: "Failed to create event", details: error.message },
      { status: 500 }
    );
  }
}
