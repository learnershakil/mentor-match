import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, parse } from "date-fns";

// GET: Fetch all calendar events for the mentor
export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can access their calendar
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can access this endpoint" },
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

    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

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

    // Fetch mentor meetings (sessions)
    const mentorMeetings = await prisma.mentorMeeting.findMany({
      where: {
        mentorId: mentor.id,
        ...dateFilter,
      },
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
    });

    // Fetch assignments with deadlines
    const assignments = await prisma.assignment.findMany({
      where: {
        mentorId: mentor.id,
        dueDate: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
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
    });

    // Fetch events
    const events = await prisma.events.findMany({
      where: {
        mentorId: mentor.id,
        startTime: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
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

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startTime,
      date: event.startTime,
      type: event.eventType,
      studentId: event.studentId,
      studentName: `${event.student.user.firstName} ${event.student.user.lastName}`,
    }));

    // Combine all events
    const allEvents = [
      ...formattedMeetings,
      ...formattedAssignments,
      ...formattedEvents,
    ];

    return NextResponse.json({ events: allEvents });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
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

    // Only mentors can create events
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can create events" },
        { status: 403 }
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

    const body = await req.json();
    const { title, description, startDate, time, type, studentId } = body;

    // Validate required fields
    if (!title || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields: title and startDate are required" },
        { status: 400 }
      );
    }

    // Validate startDate is a valid date string
    if (!isValidDateString(startDate)) {
      return NextResponse.json(
        {
          error:
            "Invalid date format. Please provide a valid date string (YYYY-MM-DD)",
        },
        { status: 400 }
      );
    }

    // Make student selection more flexible - only validate if studentId is provided
    if (
      (type === "session" || type === "meeting" || type === "deadline") &&
      studentId &&
      studentId.trim() !== ""
    ) {
      // Verify student exists if studentId is provided
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Selected student not found" },
          { status: 404 }
        );
      }
    }

    // Parse the date and time with proper validation
    let startTime = new Date(startDate);
    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Could not parse the date." },
        { status: 400 }
      );
    }

    let endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1); // Default to 1 hour if no time specified

    // If time is provided in format like "3:00 PM - 4:00 PM"
    if (time && time.includes("-")) {
      const [startTimeStr, endTimeStr] = time.split("-").map((t) => t.trim());

      try {
        // Parse times and combine with date
        const startParts = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        const endParts = endTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);

        if (startParts && endParts) {
          const startDate = new Date(startTime);
          const endDate = new Date(startTime);

          // Parse hours (converting from 12-hour to 24-hour format)
          let startHour = parseInt(startParts[1]);
          if (startParts[3].toUpperCase() === "PM" && startHour < 12)
            startHour += 12;
          if (startParts[3].toUpperCase() === "AM" && startHour === 12)
            startHour = 0;

          let endHour = parseInt(endParts[1]);
          if (endParts[3].toUpperCase() === "PM" && endHour < 12) endHour += 12;
          if (endParts[3].toUpperCase() === "AM" && endHour === 12) endHour = 0;

          // Set hours and minutes
          startDate.setHours(startHour, parseInt(startParts[2]), 0, 0);
          endDate.setHours(endHour, parseInt(endParts[2]), 0, 0);

          // Validate the time is valid (end time comes after start time)
          if (endDate <= startDate) {
            return NextResponse.json(
              { error: "End time must be after start time" },
              { status: 400 }
            );
          }

          startTime = startDate;
          endTime = endDate;
        }
      } catch (error) {
        console.error("Error parsing time:", error);
        return NextResponse.json(
          {
            error:
              "Invalid time format. Please use format like '3:00 PM - 4:00 PM'",
          },
          { status: 400 }
        );
      }
    }

    // Create the appropriate event based on type
    let result;

    if (type === "session" || type === "meeting") {
      // Create a mentor meeting
      result = await prisma.mentorMeeting.create({
        data: {
          mentorId: mentor.id,
          title,
          description: description || "",
          startTime,
          endTime,
          status: "SCHEDULED",
          category: "WebDevelopment", // Default category
          joinLink: body.joinLink || "",
        },
      });

      // Notify the student if specified and valid
      if (studentId && studentId.trim() !== "") {
        try {
          const student = await prisma.student.findUnique({
            where: { id: studentId },
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

          if (student) {
            await prisma.notification.create({
              data: {
                userId: student.user.id,
                title: "New Session Scheduled",
                content: `${
                  mentor.user?.firstName || "Your mentor"
                } has scheduled a new ${type}: "${title}" on ${format(
                  startTime,
                  "MMMM d, yyyy 'at' h:mm a"
                )}`,
                type: "SESSION",
              },
            });
          }
        } catch (error) {
          console.error("Error sending notification:", error);
          // Continue even if notification fails
        }
      }
    } else if (type === "deadline") {
      // Make student optional for deadlines too
      if (!studentId || studentId.trim() === "") {
        // Create a general deadline without student assignment
        result = await prisma.events.create({
          data: {
            mentorId: mentor.id,
            // Since studentId is required by the schema, use a placeholder or default student
            // This is a workaround; in production you might want to adjust your schema
            studentId: await getDefaultStudentId(mentor.id),
            title,
            description: description || "",
            startTime,
            eventType: "DEADLINE",
          },
        });
      } else {
        // Create a student-specific assignment with a deadline
        result = await prisma.assignment.create({
          data: {
            mentorId: mentor.id,
            studentId,
            title,
            description: description || "",
            dueDate: startTime,
            status: "PENDING",
            files: [],
          },
        });

        // Notify the student about the deadline
        try {
          const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          });

          if (student) {
            await prisma.notification.create({
              data: {
                userId: student.user.id,
                title: "New Assignment Deadline",
                content: `A new assignment "${title}" has been created with a deadline of ${format(
                  startTime,
                  "MMMM d, yyyy"
                )}`,
                type: "ASSIGNMENT",
              },
            });
          }
        } catch (error) {
          console.error("Error sending notification:", error);
          // Continue even if notification fails
        }
      }
    } else {
      // For generic events
      if (!studentId || studentId.trim() === "") {
        // Create a general event without student assignment
        result = await prisma.events.create({
          data: {
            mentorId: mentor.id,
            // Since studentId is required by the schema, use a placeholder or default student
            studentId: await getDefaultStudentId(mentor.id),
            title,
            description: description || "",
            startTime,
            eventType: type.toUpperCase(),
          },
        });
      } else {
        // Create a student-specific event
        result = await prisma.events.create({
          data: {
            mentorId: mentor.id,
            studentId,
            title,
            description: description || "",
            startTime,
            eventType: type.toUpperCase(),
          },
        });
      }
    }

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

// Helper function to get a default student ID if needed for events without students
// This is a workaround for schemas that require a studentId
async function getDefaultStudentId(mentorId: string): Promise<string> {
  try {
    // Try to find any student linked to this mentor through assignments or events
    const existingAssignment = await prisma.assignment.findFirst({
      where: { mentorId },
      select: { studentId: true },
    });

    if (existingAssignment?.studentId) {
      return existingAssignment.studentId;
    }

    const existingEvent = await prisma.events.findFirst({
      where: { mentorId },
      select: { studentId: true },
    });

    if (existingEvent?.studentId) {
      return existingEvent.studentId;
    }

    // If no existing student found, get any student from the database
    const anyStudent = await prisma.student.findFirst({
      select: { id: true },
    });

    if (anyStudent?.id) {
      return anyStudent.id;
    }

    // If no students exist, create a placeholder student (this should be rare)
    // In a production environment, you would handle this differently
    console.warn("No students found in the system - this is unusual");
    return "placeholder-student-id";
  } catch (error) {
    console.error("Error finding default student:", error);
    return "placeholder-student-id";
  }
}

// Helper function to validate date string format (YYYY-MM-DD)
function isValidDateString(dateString: string): boolean {
  // Basic format check for YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  // Check if it's actually a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
