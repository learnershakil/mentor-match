import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

interface Params {
  id: string;
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = params;

    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can reschedule sessions
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can reschedule sessions" },
        { status: 403 }
      );
    }

    // Get the mentor ID
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
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

    // Check if the session exists and belongs to this mentor
    const existingSession = await prisma.mentorMeeting.findUnique({
      where: { id },
      include: {
        mentorship: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existingSession.mentorId !== mentor.id) {
      return NextResponse.json(
        { error: "You do not have permission to reschedule this session" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { startTime, endTime, notifyStudents = true } = body;

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Start time and end time are required" },
        { status: 400 }
      );
    }

    // Update the session
    const updatedSession = await prisma.mentorMeeting.update({
      where: { id },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "SCHEDULED",
      },
    });

    // Send notifications if requested
    if (notifyStudents) {
      // Find students with matching interests to notify
      const matchingStudents = await prisma.student.findMany({
        where: {
          OR: [
            { learningInterests: { has: existingSession.category } },
            { user: { intrest: existingSession.category } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Format dates for notification
      const formattedDate = format(new Date(startTime), "EEEE, MMMM d, yyyy");
      const formattedStartTime = format(new Date(startTime), "h:mm a");
      const formattedEndTime = format(new Date(endTime), "h:mm a");

      // Create notifications
      const mentorName = `${mentor.user.firstName} ${mentor.user.lastName}`;
      const categoryFormatted = existingSession.category
        .replace(/([A-Z])/g, " $1")
        .trim();

      // Create notification for each student
      const notificationPromises = matchingStudents.map((student) =>
        prisma.notification.create({
          data: {
            userId: student.user.id,
            title: "Session Rescheduled",
            content: `${mentorName} has rescheduled the ${categoryFormatted} session "${existingSession.title}" to ${formattedDate} at ${formattedStartTime} - ${formattedEndTime}`,
            type: "SESSION",
          },
        })
      );

      await Promise.all(notificationPromises);
    }

    return NextResponse.json({
      message: "Session rescheduled successfully",
      session: updatedSession,
      notifiedStudents: notifyStudents ? true : false,
    });
  } catch (error) {
    console.error("Error rescheduling session:", error);
    return NextResponse.json(
      { error: "Failed to reschedule session", details: String(error) },
      { status: 500 }
    );
  }
}
