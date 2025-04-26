import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // Get current user session using getServerSession
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student record for the current user
    const student = await prisma.student.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get progress data with related collections
    const progress = await prisma.progress.findFirst({
      where: {
        studentId: student.id,
      },
      include: {
        skill_mastery: true,
        learning_goals: true,
        projects: true,
        certificates: true,
      },
    });

    if (!progress) {
      // If no progress data found, return empty data structure instead of error
      return NextResponse.json({
        totalSessions: 0,
        totalSessionsLastMonth: 0,
        learningHours: 0,
        learningHoursLastMonth: 0,
        completedProjects: 0,
        completedProjectsLastMonth: 0,
        skills: [],
        goals: [],
        projects: [],
        certificates: [],
      });
    }

    // Format and return the data
    return NextResponse.json({
      totalSessions: progress.totalSessions,
      totalSessionsLastMonth: progress.ts_lastMonth,
      learningHours: progress.learningHours,
      learningHoursLastMonth: progress.lh_lastMonth,
      completedProjects: progress.comp_projects,
      completedProjectsLastMonth: progress.cp_lastMonth,
      skills: progress.skill_mastery,
      goals: progress.learning_goals,
      projects: progress.projects,
      certificates: progress.certificates,
    });
  } catch (error) {
    console.error("Error fetching progress data:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress data" },
      { status: 500 }
    );
  }
}
