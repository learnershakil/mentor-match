import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Delete a message
// @ts-ignore
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.message.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
