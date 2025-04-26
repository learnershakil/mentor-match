import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET all conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

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
          },
        });

        // Count unread messages for the current user
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: {
              not: userId,
            },
            unread: true,
          },
        });

        return {
          ...conversation,
          otherParticipants,
          unreadCount,
        };
      })
    );

    return NextResponse.json(enhancedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - create a new conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { participantIds } = body;

    // Validate participantIds
    if (
      !participantIds ||
      !Array.isArray(participantIds) ||
      participantIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid participant IDs" },
        { status: 400 }
      );
    }

    // Ensure current user is included in participants
    if (!participantIds.includes(session.user.id)) {
      participantIds.push(session.user.id);
    }

    // Check if a conversation already exists with the same participants
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              hasEvery: participantIds,
            },
          },
          {
            participants: {
              every: {
                in: participantIds,
              },
            },
          },
        ],
      },
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create a new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: participantIds,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
