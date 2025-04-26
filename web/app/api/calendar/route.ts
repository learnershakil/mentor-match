import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// GET: Fetch all calendar events for the current user
export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const view = url.searchParams.get("view") || "month"; // "month" or "list"
    const limit = parseInt(url.searchParams.get("limit") || "100"); // Default limit for list view

    // Create date filters based on provided parameters
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    let events = [];

    if (session.user.role === "MENTOR") {
      // Get the mentor ID for the current user
      const mentor = await prisma.mentor.findFirst({
        where: { userId: session.user.id },
        include: {
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

      // If view is "list", don't limit by date for a comprehensive list
      let whereClause = { mentorId: mentor.id };
      if (view === "month" && Object.keys(dateFilter).length > 0) {
        whereClause = { ...whereClause, ...dateFilter };
      } else if (view === "list") {
        // For list view, only set a date filter if there's an explicit start date
        if (startDate) {
          whereClause = {
            ...whereClause,
            startTime: { gte: new Date(startDate) },
          };
        }
      }

      // Fetch mentor meetings (sessions)
      const mentorMeetings = await prisma.mentorMeeting.findMany({
        where: whereClause,
        include: {
          mentorship: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
        take: view === "list" ? limit : undefined,
      });

      // Fetch assignments with deadlines
      const assignments = await prisma.assignment.findMany({
        where: {
          mentorId: mentor.id,
          dueDate:
            view === "month" && startDate && endDate
              ? {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                }
              : undefined,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        take: view === "list" ? limit : undefined,
      });

      // Fetch events
      const eventsData = await prisma.events.findMany({
        where: {
          mentorId: mentor.id,
          startTime:
            view === "month" && startDate && endDate
              ? {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                }
              : undefined,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
        take: view === "list" ? limit : undefined,
      });

      // Format the data for calendar display
      const formattedMeetings = mentorMeetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        startDate: meeting.startTime,
        endDate: meeting.endTime,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        type: "session",
        studentId: meeting.mentorship?.user?.id,
        studentName: meeting.mentorship?.user
          ? `${meeting.mentorship.user.firstName} ${meeting.mentorship.user.lastName}`
          : undefined,
      }));

      const formattedAssignments = assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        startDate: assignment.dueDate,
        date: assignment.dueDate,
        type: "deadline",
        studentId: assignment.student.userId,
        studentName: `${assignment.student.user.firstName} ${assignment.student.user.lastName}`,
      }));

      const formattedEvents = eventsData.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startTime,
        date: event.startTime,
        type: event.eventType.toLowerCase(),
        studentId: event.studentId,
        studentName: `${event.student.user.firstName} ${event.student.user.lastName}`,
      }));

      // Combine all events
      events = [
        ...formattedMeetings,
        ...formattedAssignments,
        ...formattedEvents,
      ];
    } else if (session.user.role === "STUDENT") {
      // Get the student ID for the current user
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }

      // Fetch sessions where this student is involved
      const studentMeetings = await prisma.mentorMeeting.findMany({
        where: {
          mentorship: {
            userId: session.user.id,
          },
          ...(view === "month" && startDate && endDate ? dateFilter : {}),
        },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
        take: view === "list" ? limit : undefined,
      });

      // Fetch assignments for this student
      const studentAssignments = await prisma.assignment.findMany({
        where: {
          studentId: student.id,
          dueDate:
            view === "month" && startDate && endDate
              ? {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                }
              : undefined,
        },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        take: view === "list" ? limit : undefined,
      });

      // Format the data for calendar display
      const formattedMeetings = studentMeetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        startDate: meeting.startTime,
        endDate: meeting.endTime,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        type: "session",
        mentorId: meeting.mentorId,
        mentorName: meeting.mentor?.user
          ? `${meeting.mentor.user.firstName} ${meeting.mentor.user.lastName}`
          : undefined,
      }));

      const formattedAssignments = studentAssignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        startDate: assignment.dueDate,
        date: assignment.dueDate,
        type: "deadline",
        mentorId: assignment.mentorId,
        mentorName: `${assignment.mentor.user.firstName} ${assignment.mentor.user.lastName}`,
      }));

      // Combine all events
      events = [...formattedMeetings, ...formattedAssignments];
    }

    // Sort events by date
    events.sort((a, b) => {
      const dateA = new Date(a.startDate || a.date);
      const dateB = new Date(b.startDate || b.date);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({
      events,
      meta: {
        view,
        total: events.length,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events", details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Create a new calendar event
export async function POST(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can create events directly
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can create events directly" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, startDate, time, type } = body;

    // Validate required fields
    if (!title || !startDate || !time) {
      return NextResponse.json(
        { error: "Missing required fields: title, date and time are required" },
        { status: 400 }
      );
    }

    // Get the mentor ID for the current user
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
      include: {
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

    // Parse the date and time
    const [startTimeStr, endTimeStr] = time.split("-").map((t) => t.trim());

    if (!startTimeStr || !endTimeStr) {
      return NextResponse.json(
        {
          error:
            "Invalid time format. Please provide both start and end times.",
        },
        { status: 400 }
      );
    }

    const startDateTime = parseTimeString(startDate, startTimeStr);
    const endDateTime = parseTimeString(startDate, endTimeStr);

    if (!startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "Failed to parse date or time values" },
        { status: 400 }
      );
    }

    // Create a mentor meeting (for all event types in the dashboard calendar)
    const result = await prisma.mentorMeeting.create({
      data: {
        mentorId: mentor.id,
        title,
        description: description || "",
        startTime: startDateTime,
        endTime: endDateTime,
        status: "SCHEDULED",
        category: "WebDevelopment", // Default category
      },
    });

    return NextResponse.json(
      { message: "Event created successfully", event: result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      {
        error: "Failed to create event",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function to parse time string in format "3:00 PM"
function parseTimeString(dateStr: string, timeStr: string): Date | null {
  try {
    // Parse the base date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    // Extract hours, minutes and period
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    // Convert to 24-hour format
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    // Set the time components
    date.setHours(hours, minutes, 0, 0);
    return date;
  } catch (error) {
    console.error("Error parsing time:", error);
    return null;
  }
}
