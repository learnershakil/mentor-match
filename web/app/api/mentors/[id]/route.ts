import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET single mentor
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            bio: true,
            intrest: true,
          },
        },
        meetings: {
          where: {
            startTime: {
              gte: new Date(),
            },
            status: "SCHEDULED",
          },
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            category: true,
          },
        },
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json(mentor);
  } catch (error) {
    console.error("Error fetching mentor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - update mentor
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentor = await prisma.mentor.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Only allow the mentor to update their own profile or admin
    if (mentor.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { specialties, company, jobTitle, experience, availability } = body;

    // Prepare update data
    const updateData: any = {};

    if (specialties) updateData.specialties = specialties;
    if (company !== undefined) updateData.company = company;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (experience !== undefined) updateData.experience = experience;
    if (availability) updateData.availability = availability;

    // Update mentor
    const updatedMentor = await prisma.mentor.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedMentor);
  } catch (error) {
    console.error("Error updating mentor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - delete mentor profile (not the user)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentor = await prisma.mentor.findUnique({
      where: { id: params.id },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Delete mentor profile
    await prisma.mentor.delete({
      where: { id: params.id },
    });

    // Reset user role to STUDENT
    await prisma.user.update({
      where: { id: mentor.userId },
      data: { role: "STUDENT" },
    });

    return NextResponse.json({
      message: "Mentor profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting mentor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
