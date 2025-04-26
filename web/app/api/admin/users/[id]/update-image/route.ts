import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Update the user's image
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { image: body.image },
    });

    // Remove sensitive data before returning
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user image:", error);
    return NextResponse.json(
      { error: "Failed to update user image" },
      { status: 500 }
    );
  }
}
