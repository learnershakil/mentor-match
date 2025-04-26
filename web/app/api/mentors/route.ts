import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";

// GET all mentors with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filter parameters
    const specialty = url.searchParams.get("specialty");
    const minExperience = url.searchParams.get("minExperience");
    const minRating = url.searchParams.get("minRating");

    // Build filter conditions
    const where: any = {};

    if (specialty) {
      where.specialties = {
        has: specialty,
      };
    }

    if (minExperience) {
      where.experience = {
        gte: parseInt(minExperience),
      };
    }

    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating),
      };
    }

    // Query mentors with filters
    const [mentors, totalCount] = await Promise.all([
      prisma.mentor.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true,
              bio: true,
              intrest: true,
            },
          },
        },
        orderBy: {
          rating: "desc",
        },
      }),
      prisma.mentor.count({ where }),
    ]);

    return NextResponse.json({
      mentors,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - create a new mentor (for admin use)
export async function POST(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession( NEXT_AUTH_CONFIG );

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, specialties, company, jobTitle, experience } = body;

    // Validate required fields
    if (!userId || !specialties) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if mentor profile already exists
    const existingMentor = await prisma.mentor.findUnique({
      where: { userId },
    });

    if (existingMentor) {
      return NextResponse.json(
        { error: "Mentor profile already exists" },
        { status: 409 }
      );
    }

    // Create mentor profile
    const mentor = await prisma.mentor.create({
      data: {
        userId,
        specialties,
        company,
        jobTitle,
        experience,
      },
    });

    // Update user role to MENTOR
    await prisma.user.update({
      where: { id: userId },
      data: { role: "MENTOR" },
    });

    return NextResponse.json(mentor, { status: 201 });
  } catch (error) {
    console.error("Error creating mentor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
