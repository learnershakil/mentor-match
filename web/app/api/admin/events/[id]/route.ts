import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single event
// @ts-ignore
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const event = await prisma.events.findUnique({
      where: { id },
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

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// Update event
// @ts-ignore
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  try {
    // Validate required fields
    if (!body.studentId || !body.mentorId || !body.title || !body.startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update event
    const updatedEvent = await prisma.events.update({
      where: { id },
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

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// Delete event
// @ts-ignore
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.events.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
