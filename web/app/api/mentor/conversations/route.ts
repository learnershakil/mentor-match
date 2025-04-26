import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session || session.user.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Find the mentor's conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            sentAt: "desc",
          },
          take: 1, // Get only the latest message
        },
      },
    });

    // Get participant details and format the response
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get other participants (not the current user)
        const otherParticipantIds = conversation.participants.filter(
          (id) => id !== userId
        );

        // Get participant details
        const participants = await prisma.user.findMany({
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
            senderId: {
              not: userId,
            },
            readAt: null,
          },
        });

        // Get latest message
        const lastMessage = conversation.messages[0] || null;

        return {
          id: conversation.id,
          participants: participants.map((user) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.image,
          })),
          lastMessage: lastMessage
            ? lastMessage.content
            : "Start a conversation",
          lastMessageTime: lastMessage
            ? lastMessage.sentAt
            : conversation.updatedAt,
          unread: unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
