import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await req.json();

    // Store notification settings as a JSON string in the database
    // This example assumes you have a way to store this data
    // You might need to add a column for this or use another approach

    // For this example, we'll update a settings field, but you might need to adjust
    // this based on your actual database schema
    await db.user.update({
      where: { id: userId },
      data: {
        bio: JSON.stringify({ notificationSettings: data }), // Store in bio field temporarily
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
