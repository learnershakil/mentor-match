import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update project
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        projectName: body.projectName,
        description: body.description,
        completion: body.completion,
        viewLink: body.viewLink,
        feedback: body.feedback,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// Delete project
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
