import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create new progress
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.studentId || !body.roadmapTopicId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create progress
    const newProgress = await prisma.progress.create({
      data: {
        studentId: body.studentId,
        roadmapTopicId: body.roadmapTopicId,
        totalSessions: body.totalSessions || 0,
        ts_lastMonth: body.ts_lastMonth || 0,
        learningHours: body.learningHours || 0,
        lh_lastMonth: body.lh_lastMonth || 0,
        comp_projects: body.comp_projects || 0,
        cp_lastMonth: body.cp_lastMonth || 0,
      },
    });

    return NextResponse.json(newProgress, { status: 201 });
  } catch (error) {
    console.error("Error creating progress:", error);
    return NextResponse.json(
      { error: "Failed to create progress" },
      { status: 500 }
    );
  }
}
