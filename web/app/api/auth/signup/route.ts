import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole, Interest, SkillLevel } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      intrest, // Note: matching the schema field name
      bio,
      image,
      // Student-specific fields
      learningInterests,
      level,
      // Mentor-specific fields
      specialties,
      company,
      jobTitle,
      experience,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate role is one of the enum values
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // Validate interest is one of the enum values
    if (!Object.values(Interest).includes(intrest as Interest)) {
      return NextResponse.json(
        { message: "Invalid interest" },
        { status: 400 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        image,
        role: role as UserRole,
        intrest: intrest as Interest,
        bio,
      },
    });

    // Create student or mentor profile based on role
    if (role === "STUDENT") {
      await prisma.student.create({
        data: {
          userId: user.id,
          learningInterests: learningInterests || [intrest],
          level: level as SkillLevel,
        },
      });
    } else if (role === "MENTOR") {
      await prisma.mentor.create({
        data: {
          userId: user.id,
          specialties: specialties || [intrest],
          company,
          jobTitle,
          experience,
        },
      });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
