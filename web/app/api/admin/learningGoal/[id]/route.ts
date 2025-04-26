import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update learning goal
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();

    // Update learning goal
    const updatedLearningGoal = await prisma.learningGoal.update({
      where: { id },
      data: {
        goal: body.goal,
        target: body.target,
        completion: body.completion,
        Due: body.Due,
        due_Type: body.due_Type,
      },
    });

    return NextResponse.json(updatedLearningGoal);
  } catch (error) {
    console.error("Error updating learning goal:", error);
    return NextResponse.json(
      { error: "Failed to update learning goal" },
      { status: 500 }
    );
  }
}

// Delete learning goal
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.learningGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting learning goal:", error);
    return NextResponse.json(
      { error: "Failed to delete learning goal" },
      { status: 500 }
    );
  }
}
