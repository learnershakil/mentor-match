import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import chalk from "chalk";

// Get all messages for a conversation
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      console.log(chalk.red("Missing conversation ID in request"));
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    console.log(
      chalk.blue(`Fetching messages for conversation: ${conversationId}`)
    );

    // Verify the user is a participant in the conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      console.log(chalk.red(`Conversation not found: ${conversationId}`));
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!conversation.participants.includes(session.user.id)) {
      console.log(
        chalk.red(
          `User ${session.user.id} is not a participant in conversation ${conversationId}`
        )
      );
      return NextResponse.json(
        { error: "You don't have access to this conversation" },
        { status: 403 }
      );
    }

    // Get messages for the conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
      orderBy: {
        sentAt: "asc",
      },
    });

    console.log(
      chalk.green(
        `Found ${messages.length} messages in conversation ${conversationId}`
      )
    );

    // Mark unread messages as read if the current user is not the sender
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error(chalk.red("Error fetching messages:"), error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// Send a new message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const {
      conversationId,
      content,
      receiverId,
      attachments = [],
      messageType = "TEXT",
    } = await req.json();

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "Conversation ID and content are required" },
        { status: 400 }
      );
    }

    // Verify the user is a participant in the conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

    if (!conversation || !conversation.participants.includes(session.user.id)) {
      return NextResponse.json(
        { error: "You don't have access to this conversation" },
        { status: 403 }
      );
    }

    // Determine the receiver ID if not provided
    let determinedReceiverId = receiverId;
    if (!determinedReceiverId && conversation.participants.length === 2) {
      // For direct conversations, the receiver is the other participant
      determinedReceiverId =
        conversation.participants.find((id) => id !== session.user.id) || null;
    }

    // Determine message type based on attachments
    let actualMessageType = messageType;
    if (attachments && attachments.length > 0 && actualMessageType === "TEXT") {
      actualMessageType = "FILE";
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        receiverId: determinedReceiverId,
        content,
        attachments,
        messageType: actualMessageType as any,
        unread: true, // Set as unread initially
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    });

    // Update the conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
