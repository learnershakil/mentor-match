import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all students with their user information
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// Create new student
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

    // Check if student already exists for this user
    const existingStudent = await prisma.student.findUnique({
      where: { userId: body.userId },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student profile already exists for this user" },
        { status: 400 }
      );
    }

    // Create student
    const newStudent = await prisma.student.create({
      data: {
        userId: body.userId,
        learningInterests: body.learningInterests || [],
        level: body.level || "BEGINNER",
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
