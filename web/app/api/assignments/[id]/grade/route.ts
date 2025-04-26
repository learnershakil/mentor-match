import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can grade assignments
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can grade assignments" },
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

    // Find the assignment to check permissions and get student info
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if the mentor owns this assignment
    if (assignment.mentorId !== mentor.id) {
      return NextResponse.json(
        { error: "You don't have permission to grade this assignment" },
        { status: 403 }
      );
    }

    // Check if the assignment is in a submittable state
    if (assignment.status !== "SUBMITTED") {
      return NextResponse.json(
        {
          error:
            "This assignment cannot be graded because it has not been submitted",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { grade, feedback, notifyStudent = true } = body;

    if (!grade) {
      return NextResponse.json({ error: "Grade is required" }, { status: 400 });
    }

    // Update the assignment with grade and feedback
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        grade,
        feedback,
        status: "COMPLETED",
      },
    });

    // Send notification to student if requested
    if (notifyStudent) {
      const mentorName = `${mentor.user.firstName} ${mentor.user.lastName}`;

      await prisma.notification.create({
        data: {
          userId: assignment.student.user.id,
          title: "Assignment Graded",
          content: `${mentorName} has graded your assignment "${assignment.title}" with a grade of ${grade}.`,
          type: "ASSIGNMENT",
        },
      });
    }

    return NextResponse.json({
      message: "Assignment graded successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Error grading assignment:", error);
    return NextResponse.json(
      { error: "Failed to grade assignment", details: String(error) },
      { status: 500 }
    );
  }
}
