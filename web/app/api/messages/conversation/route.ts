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
    const { participantId, initialMessage } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Check if the participant exists
    const participant = await prisma.user.findUnique({
      where: {
        id: participantId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Check if a conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { has: userId } },
          { participants: { has: participantId } },
          { participants: { equals: [userId, participantId] } },
        ],
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        conversationId: existingConversation.id,
        message: "Conversation already exists",
      });
    }

    // Create a new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: [userId, participantId],
      },
    });

    // Add the initial message if provided
    if (initialMessage) {
      await prisma.message.create({
        data: {
          senderId: userId,
          conversationId: conversation.id,
          content: initialMessage,
        },
      });
    }

    return NextResponse.json(
      {
        conversationId: conversation.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
