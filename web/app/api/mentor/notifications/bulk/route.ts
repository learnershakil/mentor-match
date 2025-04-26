import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can send notifications
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can send notifications" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentIds, title, content, type } = body;

    // Validate required fields
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Student IDs are required and must be an array" },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type as NotificationType)) {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      );
    }

    // Get all students from student IDs
    const students = await prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },
      },
      select: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { error: "No valid students found" },
        { status: 404 }
      );
    }

    // Create notifications for all students
    const userIds = students.map(student => student.user.id);
    
    // Create notifications
    const notificationPromises = userIds.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          title,
          content,
          type: type as NotificationType,
        },
      })
    );

    const notifications = await Promise.all(notificationPromises);

    return NextResponse.json({
      message: `Successfully sent notifications to ${notifications.length} students`,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications", details: String(error) },
      { status: 500 }
    );
  }
}
