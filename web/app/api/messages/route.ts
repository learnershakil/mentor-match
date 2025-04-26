import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { conversationId, content, attachments } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "Conversation ID and content are required" },
        { status: 400 }
      );
    }

    // Verify the user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        participants: true,
      },
    });

    if (!conversation || !conversation.participants.includes(userId)) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create the new message
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        conversationId,
        content,
        attachments: attachments || [],
        unread: true,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    });

    // Update the conversation's lastUpdated timestamp
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // Format the response
    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      senderAvatar: message.sender.image,
      content: message.content,
      attachments: message.attachments,
      sentAt: message.sentAt,
      status: "sent",
    };

    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
