import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Make sure we're using the exact model name "weeklyProgress"
    const users = await prisma.user.findMany({
      where: {
        weeklyProgress: {
          none: {},
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users without progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
