import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Default search radius in kilometers
const DEFAULT_SEARCH_RADIUS = 10;

// Default coordinates for LPU campus
const LPU_LAT = 31.2546;
const LPU_LNG = 75.7033;

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get("lat") || String(LPU_LAT));
    const lng = parseFloat(url.searchParams.get("lng") || String(LPU_LNG));
    const maxDistance = parseFloat(
      url.searchParams.get("maxDistance") || String(DEFAULT_SEARCH_RADIUS)
    );
    let interest = url.searchParams.get("interest") || null;

    // If interest is not provided in query, fetch from user's profile
    if (!interest) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { intrest: true },
      });

      if (user) {
        interest = user.intrest;
      }
    }

    // Query mentors with matching interest
    const mentors = await prisma.mentor.findMany({
      where: {
        OR: [
          {
            specialties: {
              has: interest,
            },
          },
          {
            user: {
              intrest: interest as any,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            intrest: true,
            bio: true,
            // Don't select jobTitle from User as it doesn't exist there
          },
        },
      },
    });

    // For a realistic demo, generate positions for mentors around user's location
    // In a production environment, you would use real mentor locations from the database
    const lpuLocations = [
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

    // Calculate distance between two points using Haversine formula
    const calculateDistance = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ) => {
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
    };

    const deg2rad = (deg: number) => {
      return deg * (Math.PI / 180);
    };

    // Assign random locations to mentors and calculate distance
    const mentorsWithLocation = mentors.map((mentor, index) => {
      // Use modulo to cycle through the locations if we have more mentors than locations
      const locationIndex = index % lpuLocations.length;
      const location = lpuLocations[locationIndex];

      // Add some random variation to prevent all mentors from being at exact same spot
      const latVariation = (Math.random() - 0.5) * 0.005; // About 500m in latitude
      const lngVariation = (Math.random() - 0.5) * 0.005; // About 500m in longitude

      const mentorLat = location.lat + latVariation;
      const mentorLng = location.lng + lngVariation;

      // Calculate distance from user to mentor
      const distance = calculateDistance(lat, lng, mentorLat, mentorLng);

      return {
        id: mentor.id,
        name: `${mentor.user.firstName} ${mentor.user.lastName}`,
        role: mentor.jobTitle || "Mentor", // Use jobTitle from Mentor model
        image: mentor.user.image,
        rating: mentor.rating,
        specialties: mentor.specialties,
        interest: mentor.user.intrest,
        location: {
          lat: mentorLat,
          lng: mentorLng,
          name: location.name,
        },
        distance,
      };
    });

    // Filter mentors by distance and limit to 10
    const nearbyMentors = mentorsWithLocation
      .filter((mentor) => mentor.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    return NextResponse.json({
      mentors: nearbyMentors,
      userLocation: { lat, lng },
      interest,
    });
  } catch (error) {
    console.error("Error fetching nearby mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby mentors" },
      { status: 500 }
    );
  }
}
