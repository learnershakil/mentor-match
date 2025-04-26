import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Interest } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching profile for user ID:", session.user.id);

    // Get user data with mentor information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        mentor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User data retrieved:", {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
    });

    // Return the profile data
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      bio: user.bio || "",
      interest: user.intrest,
      image: user.image || "/placeholder.svg",
      mentor: user.mentor && user.mentor.length > 0 ? user.mentor[0] : null,
    });
  } catch (error) {
    console.error("Error fetching mentor profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      interest,
      intrest,
      specialties,
      company,
      jobTitle,
      experience,
      image,
      availability,
    } = data;

    // Find user and mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        mentor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate interest is one of the enum values
    const interestValue = interest || intrest;
    const validInterests = Object.values(Interest);
    if (interestValue && !validInterests.includes(interestValue as Interest)) {
      return NextResponse.json(
        { error: "Invalid interest value" },
        { status: 400 }
      );
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        email: email || user.email,
        phone: phone || user.phone,
        bio: bio || user.bio,
        intrest: (interestValue as Interest) || user.intrest,
        image: image || user.image,
      },
    });

    // Update mentor data if it exists
    let updatedMentor = null;
    if (user.mentor.length > 0) {
      updatedMentor = await prisma.mentor.update({
        where: { id: user.mentor[0].id },
        data: {
          specialties: specialties || user.mentor[0].specialties,
          company: company || user.mentor[0].company,
          jobTitle: jobTitle || user.mentor[0].jobTitle,
          experience:
            experience !== undefined ? experience : user.mentor[0].experience,
          availability: availability || user.mentor[0].availability,
        },
      });
    } else if (session.user.role === "MENTOR") {
      // Create mentor profile if it doesn't exist
      updatedMentor = await prisma.mentor.create({
        // @ts-ignore
        data: {
          userId: session.user.id,
          specialties: specialties || [user.intrest],
          company: company || "",
          jobTitle: jobTitle || "",
          experience: experience !== undefined ? experience : 0,
          availability: availability || null,
        },
      });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        password: undefined,
      },
      mentor: updatedMentor,
    });
  } catch (error) {
    console.error("Error updating mentor profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
