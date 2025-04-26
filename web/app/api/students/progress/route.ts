import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET progress for the current student
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student ID for the current user
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const roadmapTopicId = url.searchParams.get("roadmapTopicId");

    // Build query conditions
    const where: any = {
      studentId: student.id,
    };

    if (roadmapTopicId) {
      where.roadmapTopicId = roadmapTopicId;
    }

    // Get student progress data
    const progress = await prisma.progress.findMany({
      where,
      include: {
        skill_mastery: true,
        learning_goals: true,
        projects: true,
        certificates: true,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - create new progress entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student ID for the current user
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { roadmapTopicId } = body;

    // Validate required fields
    if (!roadmapTopicId) {
      return NextResponse.json(
        { error: "Roadmap topic ID is required" },
        { status: 400 }
      );
    }

    // Check if progress entry already exists
    const existingProgress = await prisma.progress.findFirst({
      where: {
        studentId: student.id,
        roadmapTopicId,
      },
    });

    if (existingProgress) {
      return NextResponse.json(
        { error: "Progress entry already exists for this roadmap topic" },
        { status: 409 }
      );
    }

    // Create new progress entry
    const progress = await prisma.progress.create({
      data: {
        studentId: student.id,
        roadmapTopicId,
      },
    });

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error("Error creating progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
