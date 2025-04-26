import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET single meeting
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.mentorMeeting.findUnique({
      where: { id: params.id },
      include: {
        mentorship: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Check if the user is the mentor for this meeting or an admin
    if (
      session.user.role === "MENTOR" &&
      meeting.mentorship.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - update meeting
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.mentorMeeting.findUnique({
      where: { id: params.id },
      include: {
        mentorship: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Only allow the mentor who created the meeting or admin to update it
    if (
      session.user.role === "MENTOR" &&
      meeting.mentorship.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      startTime,
      endTime,
      status,
      notes,
      recordingUrl,
      category,
      joinLink,
    } = body;

    // Prepare update data
    const updateData: any = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (recordingUrl !== undefined) updateData.recordingUrl = recordingUrl;
    if (category) updateData.category = category;
    if (joinLink !== undefined) updateData.joinLink = joinLink;

    // Update meeting
    const updatedMeeting = await prisma.mentorMeeting.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - delete meeting
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.mentorMeeting.findUnique({
      where: { id: params.id },
      include: {
        mentorship: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Only allow the mentor who created the meeting or admin to delete it
    if (
      session.user.role === "MENTOR" &&
      meeting.mentorship.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete meeting
    await prisma.mentorMeeting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
