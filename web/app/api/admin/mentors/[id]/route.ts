import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single mentor
export async function GET(request, { params }) {
  const { id } = params;

  try {
    console.log(`Fetching mentor with id: ${id}`);

    const mentor = await prisma.mentor.findUnique({
      where: { id },
      include: {
        user: true,
        assignments: {
          take: 5,
          orderBy: { dueDate: "desc" },
        },
        meetings: {
          take: 5,
          orderBy: { startTime: "desc" },
        },
        events: {
          take: 5,
          orderBy: { startTime: "desc" },
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
      { error: "Failed to fetch mentor", details: error.message },
      { status: 500 }
    );
  }
}

// Update mentor
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  try {
    console.log(`Updating mentor with id: ${id}`);

    // Check if mentor exists
    const existingMentor = await prisma.mentor.findUnique({
      where: { id },
    });

    if (!existingMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Log the availability data for debugging
    console.log("Updating mentor. Availability:", body.availability);

    // Prepare update data
    const updateData = {
      specialties: body.specialties || [],
      company: body.company || null,
      jobTitle: body.jobTitle || null,
      experience: body.experience ? parseInt(body.experience) : null,
      rating: body.rating ? parseFloat(body.rating) : 0,
      reviewCount: body.reviewCount ? parseInt(body.reviewCount) : 0,
      // Direct assignment of availability without manipulation
      availability: body.availability,
    };

    // Update the mentor with the processed data
    console.log("Updating mentor with availability:", updateData.availability);
    const updatedMentor = await prisma.mentor.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    });

    return NextResponse.json(updatedMentor);
  } catch (error) {
    console.error("Error updating mentor:", error);
    return NextResponse.json(
      { error: "Failed to update mentor", details: error.message },
      { status: 500 }
    );
  }
}

// Delete mentor
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    console.log(`Deleting mentor with id: ${id}`);

    await prisma.mentor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mentor:", error);
    return NextResponse.json(
      { error: "Failed to delete mentor", details: error.message },
      { status: 500 }
    );
  }
}
