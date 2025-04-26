import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single assignment
export async function GET(request, { params }) {
  const { id } = params;

  try {
    console.log(`Fetching assignment with id: ${id}`);

    const assignment = await prisma.assignment.findUnique({
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

    if (!assignment) {
      console.log(`Assignment with id ${id} not found`);
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment", details: error.message },
      { status: 500 }
    );
  }
}

// Update assignment
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();

    console.log(`Updating assignment with id: ${id}`);

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        mentorId: body.mentorId,
        studentId: body.studentId,
        dueDate: new Date(body.dueDate),
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : null,
        grade: body.grade,
        feedback: body.feedback,
        status: body.status,
        files: body.files || [],
        Comments: body.Comments,
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

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment", details: error.message },
      { status: 500 }
    );
  }
}

// Delete assignment
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    console.log(`Deleting assignment with id: ${id}`);

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment", details: error.message },
      { status: 500 }
    );
  }
}
