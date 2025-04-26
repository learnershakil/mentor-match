import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import chalk from "chalk";

// Get all conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(chalk.blue(`Fetching conversations for user: ${userId}`));

    // Find all conversations where the current user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      include: {
        messages: {
          orderBy: {
            sentAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log(chalk.green(`Found ${conversations.length} conversations`));

    // Enhance the conversations with participant details
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get the other participants' details
        const otherParticipantIds = conversation.participants.filter(
          (id) => id !== userId
        );

        const otherParticipants = await prisma.user.findMany({
          where: {
            id: {
              in: otherParticipantIds,
            },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true,
          },
        });

        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            readAt: null,
          },
        });

        return {
          id: conversation.id,
          participants: conversation.participants,
          otherParticipants,
          lastMessage: conversation.messages[0] || null,
          unreadCount,
          updatedAt: conversation.updatedAt,
        };
      })
    );

    return NextResponse.json(enhancedConversations);
  } catch (error) {
    console.error(chalk.red("Error fetching conversations:"), error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// Create a new conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const { participantIds } = await req.json();

    // Ensure the current user is included in the participants
    const allParticipants = [...new Set([session.user.id, ...participantIds])];

    // Check if all participants exist
    const participantCount = await prisma.user.count({
      where: {
        id: { in: allParticipants },
      },
    });

    if (participantCount !== allParticipants.length) {
      return NextResponse.json(
        { error: "One or more participants do not exist" },
        { status: 400 }
      );
    }

    // Check if a conversation with the same participants already exists
    // For a direct message (2 participants), we need exact matching
    const isDirectMessage = allParticipants.length === 2;

    let existingConversation = null;
    if (isDirectMessage) {
      existingConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { hasEvery: allParticipants } },
            { participants: { equals: allParticipants } },
          ],
        },
      });
    } else {
      // For group chats, check if a conversation with these exact participants exists
      existingConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { hasEvery: allParticipants } },
            { participants: { equals: allParticipants } },
          ],
        },
      });
    }

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create a new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: allParticipants,
      },
    });

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
