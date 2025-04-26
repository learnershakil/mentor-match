import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// LPU (Lovely Professional University) coordinates
const LPU_LAT = 31.2546;
const LPU_LNG = 75.7033;

// LPU campus locations for realistic mentor placement
const LPU_LOCATIONS = [
  { name: "Block 32", lat: 31.255, lng: 75.7046 },
  { name: "Block 34", lat: 31.2559, lng: 75.7042 },
  { name: "Block 38", lat: 31.2538, lng: 75.702 },
  { name: "Uni Mall", lat: 31.2528, lng: 75.7048 },
  { name: "CSE Block", lat: 31.2566, lng: 75.7036 },
  { name: "Library", lat: 31.2537, lng: 75.7058 },
  { name: "Admin Block", lat: 31.253, lng: 75.7025 },
  { name: "ECE Block", lat: 31.2545, lng: 75.7018 },
  { name: "MBA Block", lat: 31.2562, lng: 75.7063 },
  { name: "Engineering Block", lat: 31.2554, lng: 75.7075 },
];

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's interest
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        intrest: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find mentors with matching interests
    const mentors = await prisma.user.findMany({
      where: {
        role: "MENTOR",
        OR: [
          { intrest: currentUser.intrest },
          {
            mentor: {
              specialties: {
                has: currentUser.intrest,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
        bio: true,
        mentor: {
          select: {
            id: true,
            specialties: true,
            jobTitle: true,
            rating: true,
            reviewCount: true,
            company: true,
          },
        },
      },
      take: 10, // Limit to 10 mentors for performance
    });

    // Calculate distance and assign locations to mentors
    const mentorsWithLocation = mentors.map((mentor, index) => {
      // Use modulo to cycle through locations if we have more mentors than locations
      const locationIndex = index % LPU_LOCATIONS.length;
      const location = LPU_LOCATIONS[locationIndex];

      // Add slight randomization to prevent all mentors from being at exact same spot
      const latVariation = (Math.random() - 0.5) * 0.001; // Small variation
      const lngVariation = (Math.random() - 0.5) * 0.001; // Small variation

      const mentorLat = location.lat + latVariation;
      const mentorLng = location.lng + lngVariation;

      // Calculate distance from LPU center (simplified, not accounting for Earth's curvature)
      const distance = calculateDistance(
        LPU_LAT,
        LPU_LNG,
        mentorLat,
        mentorLng
      );

      return {
        id: mentor.id,
        mentorId: mentor.mentor?.id,
        name: `${mentor.firstName} ${mentor.lastName}`,
        image: mentor.image,
        bio: mentor.bio || "",
        role: mentor.mentor?.jobTitle || "Mentor",
        company: mentor.mentor?.company || "Lovely Professional University",
        specialties: mentor.mentor?.specialties || [],
        rating: mentor.mentor?.rating || 4.5,
        reviews: mentor.mentor?.reviewCount || 0,
        location: {
          name: location.name,
          lat: mentorLat,
          lng: mentorLng,
        },
        distance: parseFloat(distance.toFixed(2)),
      };
    });

    // Sort by distance
    mentorsWithLocation.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      mentors: mentorsWithLocation,
      userInterest: currentUser.intrest,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      center: { lat: LPU_LAT, lng: LPU_LNG },
    });
  } catch (error) {
    console.error("Error fetching matching mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch matching mentors" },
      { status: 500 }
    );
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
