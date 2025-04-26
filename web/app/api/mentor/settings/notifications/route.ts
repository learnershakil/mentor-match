import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    // @ts-ignore - Next-auth types issue
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can update notification settings" },
        { status: 403 }
      );
    }

    const { emailNotifications, pushNotifications } = await req.json();

    // Validate input
    if (!emailNotifications || !pushNotifications) {
      return NextResponse.json(
        { error: "Email and push notification settings are required" },
        { status: 400 }
      );
    }

    // Get the mentor record
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Parse existing availability data if any
    let availabilityData = {};
    if (mentor.availability) {
      try {
        availabilityData =
          typeof mentor.availability === "string"
            ? JSON.parse(mentor.availability)
            : mentor.availability;
      } catch (e) {
        console.error("Error parsing availability data:", e);
      }
    }

    // Update the notification settings
    const updatedAvailability = {
      ...availabilityData,
      notificationSettings: {
        emailNotifications,
        pushNotifications,
      },
    };

    // Save back to the mentor record
    const updatedMentor = await prisma.mentor.update({
      where: { id: mentor.id },
      data: {
        availability: updatedAvailability,
      },
    });

    return NextResponse.json({
      message: "Notification settings updated successfully",
      mentor: updatedMentor,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
