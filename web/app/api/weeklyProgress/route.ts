import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch the current user's weekly progress data
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user's session
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's ID from the session
    const userId = session.user.id;

    // Query parameter for limit (number of weeks to return)
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10; // Default to 10 weeks

    // Get the user's weekly progress data
    const weeklyProgressData = await prisma.weeklyProgress.findMany({
      where: {
        userId: userId,
      },
      include: {
        subTopics: true, // Include related subtopics
      },
      orderBy: {
        // Assuming there's no specific date field in the model, we'll use the ID
        // In a real app, you might want to add a "week" or "date" field for proper ordering
        id: "desc",
      },
      take: limit,
    });

    // Get user's basic information
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        firstName: true,
        lastName: true,
        intrest: true,
        role: true,
      },
    });

    // Return the data
    return NextResponse.json({
      user: user,
      weeklyProgress: weeklyProgressData,
    });
  } catch (error) {
    console.error("Error fetching weekly progress data:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly progress data" },
      { status: 500 }
    );
  }
}

// POST: Create a new weekly progress record
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user's session
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's ID from the session
    const userId = session.user.id;

    // Parse request body
    const body = await req.json();
    const {
      goals,
      sessions,
      sessionsExpected,
      projects,
      projectsExpected,
      hoursSpent,
      hoursSpentExpected,
      skills,
      skillsExpected,
      subTopics,
    } = body;

    // Create the weekly progress record
    const weeklyProgress = await prisma.weeklyProgress.create({
      // @ts-ignore
      data: {
        userId: userId,
        goals: goals || 0,
        Sessions: sessions || 0,
        SessionsE: sessionsExpected || 0,
        projects: projects || 0,
        projectsE: projectsExpected || 0,
        HoursSpent: hoursSpent || 0,
        HoursSpentE: hoursSpentExpected || 0,
        skills: skills || 0,
        skillsE: skillsExpected || 0,
        // Create subtopics if provided
        ...(subTopics && subTopics.length > 0
          ? {
              subTopics: {
                create: subTopics.map((subTopic: any) => ({
                  topic: subTopic.topic,
                  progress: subTopic.progress || 0,
                })),
              },
            }
          : {}),
      },
      // Include created subtopics in the response
      include: {
        subTopics: true,
      },
    });

    return NextResponse.json(
      {
        message: "Weekly progress created successfully",
        weeklyProgress,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating weekly progress:", error);
    return NextResponse.json(
      {
        error: "Failed to create weekly progress",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Sample usage for the POST endpoint:
 *
 * Example request:
 * ```
 * fetch('/api/weeklyProgress', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     goals: 75,                  // Goal completion percentage (0-100)
 *     sessions: 3,                // Number of completed sessions this week
 *     sessionsExpected: 4,        // Expected number of sessions
 *     projects: 1,                // Number of projects completed this week
 *     projectsExpected: 2,        // Expected number of projects
 *     hoursSpent: 12,             // Total hours spent learning this week
 *     hoursSpentExpected: 15,     // Expected hours to spend
 *     skills: 80,                 // Skill improvement percentage (0-100)
 *     skillsExpected: 100,        // Expected skill improvement
 *     subTopics: [
 *       {
 *         topic: "React Components",
 *         progress: 90            // Progress percentage (0-100)
 *       },
 *       {
 *         topic: "State Management",
 *         progress: 70
 *       },
 *       {
 *         topic: "API Integration",
 *         progress: 60
 *       }
 *     ]
 *   })
 * })
 * .then(response => response.json())
 * .then(data => console.log(data))
 * .catch(error => console.error('Error creating weekly progress:', error));
 * ```
 *
 * Example response:
 * ```
 * {
 *   "message": "Weekly progress created successfully",
 *   "weeklyProgress": {
 *     "id": "cln5abc123def",
 *     "userId": "user123",
 *     "goals": 75,
 *     "Sessions": 3,
 *     "SessionsE": 4,
 *     "projects": 1,
 *     "projectsE": 2,
 *     "HoursSpent": 12,
 *     "HoursSpentE": 15,
 *     "skills": 80,
 *     "skillsE": 100,
 *     "subTopics": [
 *       {
 *         "id": "subtopic1",
 *         "weeklyProgressId": "cln5abc123def",
 *         "topic": "React Components",
 *         "progress": 90
 *       },
 *       {
 *         "id": "subtopic2",
 *         "weeklyProgressId": "cln5abc123def",
 *         "topic": "State Management",
 *         "progress": 70
 *       },
 *       {
 *         "id": "subtopic3",
 *         "weeklyProgressId": "cln5abc123def",
 *         "topic": "API Integration",
 *         "progress": 60
 *       }
 *     ]
 *   }
 * }
 * ```
 */

// PUT: Update the latest weekly progress record
export async function PUT(req: NextRequest) {
  try {
    // Get the authenticated user's session
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's ID from the session
    const userId = session.user.id;

    // Parse request body
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Weekly progress ID is required" },
        { status: 400 }
      );
    }

    // Check if the record belongs to the current user
    const existingProgress = await prisma.weeklyProgress.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingProgress) {
      return NextResponse.json(
        { error: "Weekly progress record not found" },
        { status: 404 }
      );
    }

    if (existingProgress.userId !== userId) {
      return NextResponse.json(
        { error: "You can only update your own progress records" },
        { status: 403 }
      );
    }

    // Extract subtopics if provided
    const { subTopics, ...progressData } = updateData;

    // Update the weekly progress record
    const updatedProgress = await prisma.weeklyProgress.update({
      where: { id },
      data: {
        ...progressData,
      },
      include: {
        subTopics: true,
      },
    });

    // Update subtopics if provided
    if (subTopics && subTopics.length > 0) {
      // Handle each subtopic - update existing ones or create new ones
      for (const subTopic of subTopics) {
        if (subTopic.id) {
          // Update existing subtopic
          await prisma.subTopic.update({
            where: { id: subTopic.id },
            data: {
              topic: subTopic.topic,
              progress: subTopic.progress || 0,
            },
          });
        } else {
          // Create new subtopic
          await prisma.subTopic.create({
            data: {
              weeklyProgressId: id,
              topic: subTopic.topic,
              progress: subTopic.progress || 0,
            },
          });
        }
      }
    }

    // Fetch the updated record with all subtopics
    const finalProgress = await prisma.weeklyProgress.findUnique({
      where: { id },
      include: {
        subTopics: true,
      },
    });

    return NextResponse.json({
      message: "Weekly progress updated successfully",
      weeklyProgress: finalProgress,
    });
  } catch (error) {
    console.error("Error updating weekly progress:", error);
    return NextResponse.json(
      {
        error: "Failed to update weekly progress",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
