import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single student
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        progress: true,
        assignments: true,
        events: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

// Update student
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  try {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        learningInterests:
          body.learningInterests || existingStudent.learningInterests,
        level: body.level || existingStudent.level,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

// Delete student
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
