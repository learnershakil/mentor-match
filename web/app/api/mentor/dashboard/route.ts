import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only mentors can access their dashboard
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can access this endpoint" },
        { status: 403 }
      );
    }

    // Get the mentor profile
    const mentor = await prisma.mentor.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        specialties: true,
        rating: true,
        reviewCount: true,
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor profile not found" },
        { status: 404 }
      );
    }

    // Get mentor's interest from user record
    const mentorUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        intrest: true,
        image: true,
      },
    });

    // Count students with matching interests
    const totalStudents = await prisma.student.count({
      where: {
        // @ts-ignore
        OR: [
          // Match with mentor's specialties
          { learningInterests: { hasSome: mentor.specialties } },
          // Match with mentor's primary interest
          mentorUser?.intrest
            ? { learningInterests: { has: mentorUser.intrest } }
            : undefined,
          // Include students whose user record has matching interest
          mentorUser?.intrest
            ? { user: { intrest: mentorUser.intrest } }
            : undefined,
        ].filter(Boolean), // Remove undefined conditions
      },
    });

    // Count total sessions
    const totalSessions = await prisma.mentorMeeting.count({
      where: {
        mentorId: mentor.id,
      },
    });

    // Count total assignments
    const totalAssignments = await prisma.assignment.count({
      where: {
        mentorId: mentor.id,
      },
    });

    // Get upcoming sessions
    const now = new Date();
    const upcomingSessions = await prisma.mentorMeeting.findMany({
      where: {
        mentorId: mentor.id,
        startTime: {
          gte: now,
        },
        status: "SCHEDULED",
      },
      orderBy: {
        startTime: "asc",
      },
      take: 3,
      include: {
        mentorship: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Get recent assignments
    const recentAssignments = await prisma.assignment.findMany({
      where: {
        mentorId: mentor.id,
      },
      orderBy: {
        dueDate: "desc", // Changed from createdAt to dueDate since createdAt doesn't exist
      },
      take: 5,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Get students with matching interests for the card
    const matchingStudents = await prisma.student.findMany({
      where: {
        // @ts-ignore
        OR: [
          // Match with mentor's specialties
          { learningInterests: { hasSome: mentor.specialties } },
          // Match with mentor's primary interest
          mentorUser?.intrest
            ? { learningInterests: { has: mentorUser.intrest } }
            : undefined,
          // Include students whose user record has matching interest
          mentorUser?.intrest
            ? { user: { intrest: mentorUser.intrest } }
            : undefined,
        ].filter(Boolean),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            intrest: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
      take: 5,
    });

    // Format the response data
    const formattedSessions = upcomingSessions.map((session) => ({
      id: session.id,
      title: session.title,
      studentName: `${session.mentorship.user.firstName} ${session.mentorship.user.lastName}`,
      studentAvatar: session.mentorship.user.image,
      date: session.startTime,
      time: `${new Date(session.startTime).toLocaleTimeString()} - ${new Date(
        session.endTime
      ).toLocaleTimeString()}`,
      joinUrl: session.joinLink || "#",
    }));

    const formattedAssignments = recentAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      studentName: `${assignment.student.user.firstName} ${assignment.student.user.lastName}`,
      studentImage: assignment.student.user.image,
      dueDate: assignment.dueDate,
      status: assignment.status,
    }));

    const formattedStudents = matchingStudents.map((student: any) => ({
      id: student.id,
      userId: student.userId,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      image: student.user.image,
      interest: student.user.intrest,
      interests: student.learningInterests,
      level: student.level,
    }));

    return NextResponse.json({
      mentor: {
        id: mentor.id,
        name: `${mentorUser?.firstName} ${mentorUser?.lastName}`,
        image: mentorUser?.image,
        interest: mentorUser?.intrest,
        specialties: mentor.specialties,
      },
      stats: {
        totalStudents, // This is now only students with matching interests
        totalSessions,
        totalAssignments,
        rating: mentor.rating,
        reviewCount: mentor.reviewCount,
      },
      upcomingSessions: formattedSessions,
      recentAssignments: formattedAssignments,
      students: formattedStudents,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: String(error) },
      { status: 500 }
    );
  }
}
