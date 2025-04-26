import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create new project
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.progressId || !body.projectName || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create project
    const newProject = await prisma.project.create({
      data: {
        progressId: body.progressId,
        projectName: body.projectName,
        description: body.description,
        completion: body.completion || 0,
        viewLink: body.viewLink || null,
        feedback: body.feedback || null,
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
