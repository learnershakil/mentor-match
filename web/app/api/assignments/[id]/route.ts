import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

interface Params {
  params: {
    id: string;
  };
}

// GET: Get a specific assignment
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the assignment
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
                email: true,
                image: true,
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
                image: true,
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

    // Check authorization based on user role
    if (session.user.role === "MENTOR") {
      // Get mentor ID
      const mentor = await prisma.mentor.findFirst({
        where: { userId: session.user.id },
      });

      if (!mentor || mentor.id !== assignment.mentorId) {
        return NextResponse.json(
          { error: "You don't have permission to access this assignment" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "STUDENT") {
      // Get student ID
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
      });

      if (!student || student.id !== assignment.studentId) {
        return NextResponse.json(
          { error: "You don't have permission to access this assignment" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

// PUT: Update an assignment
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the assignment to check permissions and get original values
    const existingAssignment = await prisma.assignment.findUnique({
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
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Only the mentor who created the assignment can update it
    if (session.user.role === "MENTOR") {
      const mentor = await prisma.mentor.findFirst({
        where: { userId: session.user.id },
      });

      if (!mentor || mentor.id !== existingAssignment.mentorId) {
        return NextResponse.json(
          { error: "You don't have permission to update this assignment" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "STUDENT") {
      // Students can only submit assignments (handled elsewhere)
      return NextResponse.json(
        { error: "Students cannot update assignment details" },
        { status: 403 }
      );
    } else {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
    }

    // Parse the request body
    const body = await req.json();
    const { title, description, dueDate, files, notifyStudent = false } = body;

    // Update the assignment
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (files !== undefined) updateData.files = files;

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
    });

    // Send a notification to the student if requested
    if (notifyStudent) {
      const mentorName = `${existingAssignment.mentor.user.firstName} ${existingAssignment.mentor.user.lastName}`;
      const formattedDate = format(
        new Date(dueDate || existingAssignment.dueDate),
        "MMMM d, yyyy"
      );

      await prisma.notification.create({
        data: {
          userId: existingAssignment.student.user.id,
          title: "Assignment Updated",
          content: `${mentorName} has updated the assignment "${
            title || existingAssignment.title
          }". The due date is ${formattedDate}.`,
          type: "ASSIGNMENT",
        },
      });
    }

    return NextResponse.json({
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete an assignment
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can delete assignments
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can delete assignments" },
        { status: 403 }
      );
    }

    // Get the assignment to check permissions and get student info for notification
    const existingAssignment = await prisma.assignment.findUnique({
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
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Get mentor ID
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
    });

    if (!mentor || mentor.id !== existingAssignment.mentorId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this assignment" },
        { status: 403 }
      );
    }

    // Delete the assignment
    await prisma.assignment.delete({
      where: { id },
    });

    // Send a notification to the student
    const mentorName = `${existingAssignment.mentor.user.firstName} ${existingAssignment.mentor.user.lastName}`;

    await prisma.notification.create({
      data: {
        userId: existingAssignment.student.user.id,
        title: "Assignment Deleted",
        content: `${mentorName} has deleted the assignment "${existingAssignment.title}".`,
        type: "ASSIGNMENT",
      },
    });

    return NextResponse.json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment", details: String(error) },
      { status: 500 }
    );
  }
}
