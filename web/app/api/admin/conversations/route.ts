import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Get all conversations for the admin panel
export async function GET() {
  try {
    // Get all conversations with latest message and participants
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            sentAt: "desc",
          },
          take: 1,
        },
      },
    });

    // Get all participants info and unread count
    const enhancedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get participants info
        const participantIds = conv.participants;
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
          },
        });

        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            readAt: null,
            unread: true,
          },
        });

        return {
          id: conv.id,
          participants,
          latestMessage: conv.messages[0] || null,
          unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json(enhancedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
