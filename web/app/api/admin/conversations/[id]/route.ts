import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a single conversation with all messages
// @ts-ignore
export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Get the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get participants info
    const participantIds = conversation.participants;
    const participants = await prisma.user.findMany({
      where: {
        id: {
          in: participantIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        role: true,
      },
    });

    // Get all messages with sender info
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
      },
      orderBy: {
        sentAt: "asc",
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

    // Add isAdmin flag to messages
    const enhancedMessages = messages.map((message) => ({
      ...message,
      isAdmin: message.sender.role === "ADMIN",
    }));

    return NextResponse.json({
      conversation: {
        ...conversation,
        participants,
      },
      messages: enhancedMessages,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// Delete a conversation and all its messages
// @ts-ignore
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // First delete all messages in the conversation
    await prisma.message.deleteMany({
      where: {
        conversationId: id,
      },
    });

    // Then delete the conversation
    await prisma.conversation.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
