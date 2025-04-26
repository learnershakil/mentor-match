import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can send messages
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can use this endpoint" },
        { status: 403 }
      );
    }

    // Get mentor ID
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { studentIds, content, attachments = [] } = body;

    // Validate required fields
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Student IDs are required and must be an array" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Get student user IDs from student IDs
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

    // Create or find conversations for each student
    const conversations = [];
    const messages = [];
    const notifications = [];

    for (const student of students) {
      // Check if a conversation already exists between mentor and student
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          participants: {
            hasEvery: [session.user.id, student.user.id],
          },
        },
      });

      let conversation;
      if (existingConversation) {
        conversation = existingConversation;
      } else {
        // Create a new conversation if none exists
        conversation = await prisma.conversation.create({
          data: {
            participants: [session.user.id, student.user.id],
          },
        });
        conversations.push(conversation);
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          senderId: session.user.id,
          conversationId: conversation.id,
          content,
          attachments,
          unread: true,
        },
      });
      messages.push(message);

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          userId: student.user.id,
          title: "New Message",
          content: `You have a new message from your mentor`,
          type: "MESSAGE",
        },
      });
      notifications.push(notification);
    }

    return NextResponse.json({
      message: `Successfully sent messages to ${messages.length} students`,
      count: messages.length,
    });
  } catch (error) {
    console.error("Error sending messages:", error);
    return NextResponse.json(
      { error: "Failed to send messages", details: String(error) },
      { status: 500 }
    );
  }
}
