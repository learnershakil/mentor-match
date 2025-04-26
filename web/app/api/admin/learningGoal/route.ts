import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create new learning goal
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.progressId || !body.goal) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create learning goal
    const newLearningGoal = await prisma.learningGoal.create({
      data: {
        progressId: body.progressId,
        goal: body.goal,
        target: body.target || "WEEKLY",
        completion: body.completion || 0,
        Due: body.Due || 0,
        due_Type: body.due_Type || "WEEKLY",
      },
    });

    return NextResponse.json(newLearningGoal, { status: 201 });
  } catch (error) {
    console.error("Error creating learning goal:", error);
    return NextResponse.json(
      { error: "Failed to create learning goal" },
      { status: 500 }
    );
  }
}
