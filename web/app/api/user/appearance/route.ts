import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch appearance settings
export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Simulated appearance settings since we don't have a dedicated table yet
    const settings = {
      theme: "light", // light, dark, system
      fontSize: "medium", // small, medium, large
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching appearance settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch appearance settings" },
      { status: 500 }
    );
  }
}

// PUT: Update appearance settings
export async function PUT(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { theme, fontSize } = body;

    // Validate theme and fontSize
    if (theme && !["light", "dark", "system"].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme selection" },
        { status: 400 }
      );
    }

    if (fontSize && !["small", "medium", "large"].includes(fontSize)) {
      return NextResponse.json(
        { error: "Invalid font size selection" },
        { status: 400 }
      );
    }

    // For simplicity, we'll just return the updated settings
    // In a real app, you'd save these to a user_settings table
    const updatedSettings = {
      theme: theme || "light",
      fontSize: fontSize || "medium",
    };

    return NextResponse.json({
      message: "Appearance settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating appearance settings:", error);
    return NextResponse.json(
      { error: "Failed to update appearance settings" },
      { status: 500 }
    );
  }
}
