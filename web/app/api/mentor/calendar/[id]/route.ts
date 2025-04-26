import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, parse } from "date-fns";

// Helper to determine event type from ID format or request
const determineEventType = async (id: string, mentorId: string) => {
  // Try to find the event in each table
  const meeting = await prisma.mentorMeeting.findFirst({
    where: { id, mentorId },
  });

  if (meeting) return "meeting";

  const assignment = await prisma.assignment.findFirst({
    where: { id, mentorId },
  });

  if (assignment) return "assignment";

  const event = await prisma.events.findFirst({
    where: { id, mentorId },
  });

  if (event) return "event";

  return null; // Not found in any table
};

// PUT: Update a calendar event
export async function PUT(
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

    // Only mentors can update events
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can update events" },
        { status: 403 }
      );
    }

    // Get the mentor ID for the current user
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    const eventType = await determineEventType(id, mentor.id);

    if (!eventType) {
      return NextResponse.json(
        { error: "Event not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, startDate, time, type, studentId } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!startDate) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Validate date format
    try {
      const testDate = new Date(startDate);
      if (isNaN(testDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format. Please provide a valid date." },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Parse the date and time with proper validation
    let startTime = new Date(startDate);
    let endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1); // Default to 1 hour later

    // If time is provided in format like "3:00 PM - 4:00 PM"
    if (time && time.includes("-")) {
      const [startTimeStr, endTimeStr] = time.split("-").map((t) => t.trim());

      try {
        // Parse times and combine with date
        const startFormatted = format(startTime, "yyyy-MM-dd");
        const parsedStartTime = parse(
          `${startFormatted} ${startTimeStr}`,
          "yyyy-MM-dd h:mm a",
          new Date()
        );
        const parsedEndTime = parse(
          `${startFormatted} ${endTimeStr}`,
          "yyyy-MM-dd h:mm a",
          new Date()
        );

        // Only use parsed times if they're valid
        if (
          !isNaN(parsedStartTime.getTime()) &&
          !isNaN(parsedEndTime.getTime())
        ) {
          startTime = parsedStartTime;
          endTime = parsedEndTime;
        }
      } catch (error) {
        console.error("Error parsing time:", error);
        // If parsing fails, keep the default times
      }
    }

    // Update the appropriate event based on type
    let result;

    if (eventType === "meeting") {
      // Update a mentor meeting
      result = await prisma.mentorMeeting.update({
        where: { id },
        data: {
          title,
          description: description || "",
          startTime,
          endTime,
        },
      });
    } else if (eventType === "assignment") {
      // Update an assignment deadline
      result = await prisma.assignment.update({
        where: { id },
        data: {
          title,
          description: description || "",
          dueDate: startTime,
          // Only update studentId if provided and valid
          ...(studentId && studentId.trim() !== "" ? { studentId } : {}),
        },
      });
    } else if (eventType === "event") {
      // Update a generic event
      result = await prisma.events.update({
        where: { id },
        data: {
          title,
          description: description || "",
          startTime,
          // Only update studentId if provided and valid
          ...(studentId && studentId.trim() !== "" ? { studentId } : {}),
        },
      });
    }

    return NextResponse.json({
      message: "Event updated successfully",
      event: result,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete a calendar event
export async function DELETE(
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

    // Only mentors can delete events
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can delete events" },
        { status: 403 }
      );
    }

    // Get the mentor ID for the current user
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    const eventType = await determineEventType(id, mentor.id);

    if (!eventType) {
      return NextResponse.json(
        { error: "Event not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete the appropriate event based on type
    if (eventType === "meeting") {
      await prisma.mentorMeeting.delete({
        where: { id },
      });
    } else if (eventType === "assignment") {
      await prisma.assignment.delete({
        where: { id },
      });
    } else if (eventType === "event") {
      await prisma.events.delete({
        where: { id },
      });
    }

    return NextResponse.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event", details: String(error) },
      { status: 500 }
    );
  }
}
