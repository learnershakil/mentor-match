import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Find the student record for this user
    const student = await prisma.student.findFirst({
      where: { userId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    // Fetch overall progress data
    const progress = await prisma.progress.findFirst({
      where: { studentId: student.id },
      include: {
        skill_mastery: true,
        learning_goals: {
          orderBy: { Due: "asc" },
        },
      },
    });

    // Fetch weekly progress data for this user
    const weeklyProgress = await prisma.weeklyProgress.findFirst({
      where: { userId },
      include: {
        subTopics: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format skill mastery data (if exists)
    const skills =
      progress?.skill_mastery?.map((skill) => ({
        name: skill.skill,
        level: getSkillLevel(skill.masteryLevel),
        progress: skill.masteryLevel,
      })) || [];

    // Get current goal (if exists)
    const currentGoal = progress?.learning_goals?.[0]
      ? {
          title: progress.learning_goals[0].goal,
          progress: progress.learning_goals[0].completion,
          dueIn: getDueInText(progress.learning_goals[0].Due),
          type: progress.learning_goals[0].target.toLowerCase(),
        }
      : null;

    // Format stats data
    const stats = {
      completedSessions: progress?.totalSessions || 0,
      learningHours: progress?.learningHours || 0,
      completedProjects: progress?.comp_projects || 0,
      sessionsLastMonth: progress?.ts_lastMonth || 0,
      hoursLastMonth: progress?.lh_lastMonth || 0,
      projectsLastMonth: progress?.cp_lastMonth || 0,
    };

    // Return formatted response
    return NextResponse.json({
      skills,
      currentGoal,
      stats,
      weeklyStats: weeklyProgress
        ? {
            goals: weeklyProgress.goals || 0,
            sessions: weeklyProgress.Sessions || 0,
            projects: weeklyProgress.projects || 0,
            hoursSpent: weeklyProgress.HoursSpent || 0,
            subTopics: weeklyProgress.subTopics,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching progress data:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress data" },
      { status: 500 }
    );
  }
}

// Helper function to determine skill level based on mastery percentage
function getSkillLevel(masteryLevel: number): string {
  if (masteryLevel >= 90) return "Advanced";
  if (masteryLevel >= 70) return "Intermediate";
  if (masteryLevel >= 40) return "Basic";
  return "Beginner";
}

// Helper function to format due date information
function getDueInText(due: number): string {
  if (due <= 1) return "1 day";
  if (due <= 7) return `${due} days`;
  if (due <= 14) return "2 weeks";
  if (due <= 30) return "1 month";
  return "over a month";
}
