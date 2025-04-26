import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create new skill mastery record
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.progressId || !body.skill || body.masteryLevel === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create skill mastery record
    const newSkillMastery = await prisma.skillMastery.create({
      data: {
        progressId: body.progressId,
        skill: body.skill,
        masteryLevel: body.masteryLevel,
      },
    });

    return NextResponse.json(newSkillMastery, { status: 201 });
  } catch (error) {
    console.error("Error creating skill mastery:", error);
    return NextResponse.json(
      { error: "Failed to create skill mastery" },
      { status: 500 }
    );
  }
}
