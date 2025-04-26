import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Find users who don't have a student profile yet
    const users = await prisma.user.findMany({
      where: {
        student: {
          none: {},
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching non-student users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
