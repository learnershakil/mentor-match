import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Create a separate table for notification settings if it doesn't exist
// For now, we'll use a simulated approach with metadata in existing tables

// GET: Fetch notification settings
export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real application, you would fetch this from a notifications_settings table
    // For now, we'll check if there's any metadata stored
    let settings;

    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      // Simulate settings - in production, this would come from your database
      settings = {
        emailNotifications: {
          sessionReminders: true,
          newMessages: true,
          assignmentUpdates: true,
          platformUpdates: false,
        },
        pushNotifications: {
          sessionReminders: true,
          newMessages: true,
          assignmentUpdates: false,
        },
      };
    } else if (session.user.role === "MENTOR") {
      const mentor = await prisma.mentor.findUnique({
        where: { userId: session.user.id },
        select: { id: true, availability: true },
      });

      // Try to extract notification settings from availability JSON if present
      let extractedSettings = {};
      if (mentor?.availability) {
        try {
          const availabilityData =
            typeof mentor.availability === "string"
              ? JSON.parse(mentor.availability)
              : mentor.availability;

          if (availabilityData.notificationSettings) {
            extractedSettings = availabilityData.notificationSettings;
          }
        } catch (e) {
          console.error("Error parsing mentor availability data:", e);
        }
      }

      // Provide default settings
      settings = {
        emailNotifications: {
          sessionReminders: true,
          newMessages: true,
          assignmentSubmissions: true,
          platformUpdates: false,
          ...extractedSettings?.emailNotifications,
        },
        pushNotifications: {
          sessionReminders: true,
          newMessages: true,
          assignmentSubmissions: true,
          ...extractedSettings?.pushNotifications,
        },
      };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

// PUT: Update notification settings
export async function PUT(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { emailNotifications, pushNotifications } = body;

    if (!emailNotifications && !pushNotifications) {
      return NextResponse.json(
        { error: "No notification settings provided" },
        { status: 400 }
      );
    }

    // In a real application, you would update a dedicated notifications_settings table
    // For this implementation, we'll store in metadata for the respective role

    if (session.user.role === "MENTOR") {
      const mentor = await prisma.mentor.findUnique({
        where: { userId: session.user.id },
        select: { id: true, availability: true },
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
      await prisma.mentor.update({
        where: { id: mentor.id },
        data: {
          availability: updatedAvailability,
        },
      });
    } else if (session.user.role === "STUDENT") {
      // For students, we would update a hypothetical student_settings table
      // For now, this is just a placeholder
      console.log(
        `Updated notification settings for student ${session.user.id}`
      );
    }

    return NextResponse.json({
      message: "Notification settings updated successfully",
      settings: {
        emailNotifications,
        pushNotifications,
      },
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
