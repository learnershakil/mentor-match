import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all notifications
export async function GET() {
  try {
    console.log("Fetching notifications...");

    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${notifications.length} notifications`);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      // @ts-ignore
      { error: "Failed to fetch notifications", details: error.message },
      { status: 500 }
    );
  }
}

// Create new notification
// @ts-ignore
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.title || !body.content || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create notification
    const newNotification = await prisma.notification.create({
      data: {
        userId: body.userId,
        title: body.title,
        content: body.content,
        type: body.type,
        isRead: body.isRead || false,
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

    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      // @ts-ignore
      { error: "Failed to create notification", details: error.message },
      { status: 500 }
    );
  }
}
