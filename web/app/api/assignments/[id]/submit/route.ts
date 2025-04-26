import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure request is properly parsed and params are available
    if (!params || !params.id) {
      return NextResponse.json(
        { error: "Missing assignment ID" },
        { status: 400 }
      );
    }

    const assignmentId = params.id;

    // Parse request body before proceeding with other operations
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { files, comments } = body;

    // Check authentication after parsing request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify prisma connection before making queries
    if (!prisma) {
      console.error("Database connection failed");
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    // Verify the user is a student
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Only students can submit assignments" },
        { status: 403 }
      );
    }

    // Check if the assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify this assignment belongs to the student
    if (assignment.studentId !== student.id) {
      return NextResponse.json(
        { error: "You can only submit your own assignments" },
        { status: 403 }
      );
    }

    // Determine the status (LATE if past due date)
    const now = new Date();
    const status = now > assignment.dueDate ? "LATE" : "SUBMITTED";

    // Update the assignment with submission details
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status,
        submittedAt: now,
        files: files || [],
        Comments: comments || null,
      },
    });

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json(
      { error: "Failed to submit assignment" },
      { status: 500 }
    );
  }
}
