import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single weekly progress
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const weeklyProgress = await prisma.weeklyProgress.findUnique({
      where: { id },
      include: {
        user: true,
        subTopics: true,
      },
    });

    if (!weeklyProgress) {
      return NextResponse.json(
        { error: "Weekly progress not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(weeklyProgress);
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly progress" },
      { status: 500 }
    );
  }
}

// Update weekly progress
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  try {
    // First update weekly progress
    const updatedProgress = await prisma.weeklyProgress.update({
      where: { id },
      data: {
        goals: body.goals,
        Sessions: body.Sessions,
        SessionsE: body.SessionsE,
        projects: body.projects,
        projectsE: body.projectsE,
        HoursSpent: body.HoursSpent,
        HoursSpentE: body.HoursSpentE,
        skills: body.skills,
        skillsE: body.skillsE,
      },
    });

    // Update subtopics
    if (body.subTopics && Array.isArray(body.subTopics)) {
      // First delete existing subtopics
      await prisma.subTopic.deleteMany({
        where: { weeklyProgressId: id },
      });

      // Add new ones
      for (const topic of body.subTopics.filter((t) => t.topic.trim() !== "")) {
        await prisma.subTopic.create({
          data: {
            weeklyProgressId: id,
            topic: topic.topic,
            progress: topic.progress || 0,
          },
        });
      }
    }

    // Get updated record with relations
    const result = await prisma.weeklyProgress.findUnique({
      where: { id },
      include: {
        user: true,
        subTopics: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating weekly progress:", error);
    return NextResponse.json(
      { error: "Failed to update weekly progress" },
      { status: 500 }
    );
  }
}

// Delete weekly progress
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // First delete all associated subtopics
    await prisma.subTopic.deleteMany({
      where: { weeklyProgressId: id },
    });

    // Then delete the weekly progress
    await prisma.weeklyProgress.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting weekly progress:", error);
    return NextResponse.json(
      { error: "Failed to delete weekly progress" },
      { status: 500 }
    );
  }
}
