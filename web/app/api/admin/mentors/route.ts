import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all mentors with user information
export async function GET() {
  try {
    console.log("Fetching mentors data...");

    // Simple query first to test connection
    try {
      const count = await prisma.mentor.count();
      console.log(`Mentor count: ${count}`);
    } catch (countError) {
      console.error("Error counting mentors:", countError);
      return NextResponse.json(
        {
          error: "Database connection error",
          details:
            countError instanceof Error
              ? countError.message
              : String(countError),
        },
        { status: 500 }
      );
    }

    // Fetch mentors with their user data
    const mentors = await prisma.mentor.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            intrest: true,
            image: true,
            bio: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    console.log(`Found ${mentors.length} mentors`);
    return NextResponse.json(mentors);
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch mentors",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Create new mentor
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if mentor already exists for this user
    const existingMentor = await prisma.mentor.findUnique({
      where: { userId: body.userId },
    });

    if (existingMentor) {
      return NextResponse.json(
        { error: "Mentor profile already exists for this user" },
        { status: 400 }
      );
    }

    // Log the availability data for debugging
    console.log("Availability from client:", body.availability);

    // Prepare mentor data with proper typing
    const mentorData = {
      userId: body.userId,
      specialties: body.specialties || [],
      company: body.company || null,
      jobTitle: body.jobTitle || null,
      experience: body.experience ? parseInt(body.experience) : null,
      rating: body.rating ? parseFloat(body.rating) : 0,
      reviewCount: body.reviewCount ? parseInt(body.reviewCount) : 0,
      // Handle availability correctly - don't modify the data structure
      availability: body.availability,
    };

    // Create mentor
    const newMentor = await prisma.mentor.create({
      data: mentorData,
      include: {
        user: true,
      },
    });

    return NextResponse.json(newMentor, { status: 201 });
  } catch (error) {
    console.error("Error creating mentor:", error);
    return NextResponse.json(
      { error: "Failed to create mentor", details: error.message },
      { status: 500 }
    );
  }
}
