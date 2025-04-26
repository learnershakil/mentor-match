import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Send a new message
// @ts-ignore
export async function POST(request) {
  try {
    const body = await request.json();
    const { content, receiverId, conversationId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Get current user (admin)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const senderId = session.user.id;

    let targetConversationId = conversationId;

    // If sending to a new recipient (no conversationId), find or create a conversation
    if (!targetConversationId && receiverId) {
      // Check if a conversation already exists between these users
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          participants: {
            hasEvery: [senderId, receiverId],
          },
        },
      });

      if (existingConversation) {
        targetConversationId = existingConversation.id;
      } else {
        // Create new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            participants: [senderId, receiverId],
          },
        });
        targetConversationId = newConversation.id;
      }
    }

    if (!targetConversationId) {
      return NextResponse.json(
        { error: "Either conversationId or receiverId is required" },
        { status: 400 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      // @ts-ignore
      data: {
        senderId,
        receiverId: receiverId || null,
        conversationId: targetConversationId,
        content,
        unread: true,
        attachments: [],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Update conversation's updated_at timestamp
    await prisma.conversation.update({
      where: {
        id: targetConversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // Add isAdmin flag
    const enhancedMessage = {
      ...message,
      // @ts-ignore
      isAdmin: message.sender.role === "ADMIN",
    };

    return NextResponse.json(enhancedMessage, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      // @ts-ignore
      { error: "Failed to send message", details: error.message },
      { status: 500 }
    );
  }
}
