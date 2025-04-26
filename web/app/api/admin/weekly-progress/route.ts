import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all weekly progress records
export async function GET() {
  try {
    console.log("Fetching weekly progress data...");

    const progress = await prisma.weeklyProgress.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subTopics: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    console.log(`Found ${progress.length} weekly progress records`);
    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly progress" },
      { status: 500 }
    );
  }
}

// Create new weekly progress
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create progress with transaction to ensure all operations complete
    const result = await prisma.$transaction(async (tx) => {
      // Create the weekly progress - fixed syntax error here
      const progressRecord = await tx.weeklyProgress.create({
        data: {
          userId: body.userId,
          goals: body.goals || 0,
          Sessions: body.Sessions || 0,
          SessionsE: body.SessionsE || 0,
          projects: body.projects || 0,
          projectsE: body.projectsE || 0,
          HoursSpent: body.HoursSpent || 0,
          HoursSpentE: body.HoursSpentE || 0,
          skills: body.skills || 0,
          skillsE: body.skillsE || 0,
        },
      });

      // Create subtopics if provided
      if (body.subTopics && Array.isArray(body.subTopics)) {
        for (const topic of body.subTopics.filter(
          (t) => t.topic.trim() !== ""
        )) {
          await tx.subTopic.create({
            data: {
              weeklyProgressId: progressRecord.id,
              topic: topic.topic,
              progress: topic.progress || 0,
            },
          });
        }
      }

      // Return the created weekly progress with relations
      return await tx.weeklyProgress.findUnique({
        where: { id: progressRecord.id },
        include: {
          user: true,
          subTopics: true,
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating weekly progress:", error);
    return NextResponse.json(
      { error: "Failed to create weekly progress" },
      { status: 500 }
    );
  }
}
