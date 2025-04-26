import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Mark all messages in a conversation as read
// @ts-ignore
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    // Mark all unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        readAt: null,
        unread: true,
      },
      data: {
        readAt: new Date(),
        unread: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
