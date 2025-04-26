import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single notification
// @ts-ignore
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}

// Update notification
// @ts-ignore
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  try {
    // Validate required fields if they're present
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        ...(body.userId && { userId: body.userId }),
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.type && { type: body.type }),
        ...{ isRead: body.isRead !== undefined ? body.isRead : undefined },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// Delete notification
// @ts-ignore
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
