import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single meeting
// @ts-ignore
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const meeting = await prisma.mentorMeeting.findUnique({
      where: { id },
      include: {
        mentorship: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
      { status: 500 }
    );
  }
}

// Update meeting
// @ts-ignore
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  try {
    // Update meeting
    const updatedMeeting = await prisma.mentorMeeting.update({
      where: { id },
      data: {
        mentorId: body.mentorId,
        title: body.title,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        status: body.status,
        notes: body.notes,
        recordingUrl: body.recordingUrl,
        category: body.category,
        joinLink: body.joinLink,
      },
      include: {
        mentorship: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

// Delete meeting
// @ts-ignore
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.mentorMeeting.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}
