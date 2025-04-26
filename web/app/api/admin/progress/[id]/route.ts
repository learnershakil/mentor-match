import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update progress
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();

    // Update progress
    const updatedProgress = await prisma.progress.update({
      where: { id },
      data: {
        roadmapTopicId: body.roadmapTopicId,
        totalSessions: body.totalSessions || 0,
        ts_lastMonth: body.ts_lastMonth || 0,
        learningHours: body.learningHours || 0,
        lh_lastMonth: body.lh_lastMonth || 0,
        comp_projects: body.comp_projects || 0,
        cp_lastMonth: body.cp_lastMonth || 0,
      },
    });

    return NextResponse.json(updatedProgress);
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// Delete progress
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.progress.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting progress:", error);
    return NextResponse.json(
      { error: "Failed to delete progress" },
      { status: 500 }
    );
  }
}
