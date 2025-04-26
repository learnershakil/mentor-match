import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all assignments with related data
export async function GET() {
  try {
    console.log("Fetching assignments data...");

    // Try an extremely simple query first to test connection
    try {
      const count = await prisma.assignment.count();
      console.log(`Assignment count: ${count}`);
    } catch (countError) {
      console.error("Error counting assignments:", countError);
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

    // Simplify the query to just get basic assignment data without complex includes
    const assignments = await prisma.assignment.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        studentId: true,
        mentorId: true,
        // Remove createdAt from selection
        // Simplified includes to avoid deep nesting
        student: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        mentor: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      // Change orderBy to use id instead of createdAt
      orderBy: {
        id: "desc",
      },
    });

    console.log(`Found ${assignments.length} assignments`);
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    // More detailed error response
    return NextResponse.json(
      {
        error: "Failed to fetch assignments",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Create new assignment
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.mentorId || !body.studentId || !body.dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create assignment
    const newAssignment = await prisma.assignment.create({
      data: {
        title: body.title,
        description: body.description || "",
        mentorId: body.mentorId,
        studentId: body.studentId,
        dueDate: new Date(body.dueDate),
        status: body.status || "PENDING",
        files: body.files || [],
        Comments: body.Comments || null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        mentor: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
