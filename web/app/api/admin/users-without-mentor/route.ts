import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Fetching users without mentor profiles");

    // Find users who don't have a mentor profile yet
    const users = await prisma.user.findMany({
      where: {
        mentor: {
          none: {},
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    console.log(`Found ${users.length} users without mentor profiles`);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users without mentor profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}
