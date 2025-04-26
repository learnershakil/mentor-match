import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update skill mastery
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();

    // Update skill mastery
    const updatedSkillMastery = await prisma.skillMastery.update({
      where: { id },
      data: {
        skill: body.skill,
        masteryLevel: body.masteryLevel,
      },
    });

    return NextResponse.json(updatedSkillMastery);
  } catch (error) {
    console.error("Error updating skill mastery:", error);
    return NextResponse.json(
      { error: "Failed to update skill mastery" },
      { status: 500 }
    );
  }
}

// Delete skill mastery
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.skillMastery.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting skill mastery:", error);
    return NextResponse.json(
      { error: "Failed to delete skill mastery" },
      { status: 500 }
    );
  }
}
