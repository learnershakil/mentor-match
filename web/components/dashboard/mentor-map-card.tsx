"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, User } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// OpenStreetMap with Leaflet doesn't require an API key
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MentorMapCardProps {
  className?: string;
}

interface MentorLocation {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  specialties: string[];
  interest: string;
  rating: number;
  lat: number;
  lng: number;
  distance: number;
  details?: any; // Add this to store additional mentor details
}

interface UserData {
  id: string;
  interest: string;
}

export function MentorMapCard({ className }: MentorMapCardProps) {
  // Lovely Professional University coordinates
  const LPU_COORDINATES = { lat: 31.2546, lng: 75.7033 };

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapCenter, setMapCenter] = useState(LPU_COORDINATES);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyMentors, setNearbyMentors] = useState<MentorLocation[]>([]);
  const [userInterest, setUserInterest] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mentorsData, setMentorsData] = useState<any>();
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const router = useRouter();

  // Check if we're running on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch mentors with matching interests using the interest API
  useEffect(() => {
    if (!isClient) return;

    const fetchMatchingMentors = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/interest");

        if (!response.ok) {
          throw new Error(
            `Failed to fetch data: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        setUserInterest(data.currentUserInterest);
        setCurrentUserRole(data.currentUserRole);

        if (data.matchingUsers && Array.isArray(data.matchingUsers)) {
          // Generate positions for mentors around LPU
          const mentorsWithLocation = generateLocationsForMentors(
            data.matchingUsers
          );
          setNearbyMentors(mentorsWithLocation);

          // Add markers once map is ready
          if (leafletMapRef.current) {
            addMentorMarkers(mentorsWithLocation);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching matching mentors:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load mentors"
        );
        toast.error("Failed to load mentors with matching interests");
        setIsLoading(false);
      }
    };

    fetchMatchingMentors();
  }, [isClient]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!isClient || !mapRef.current || typeof L === "undefined") return;

    // Only create the map once
    if (leafletMapRef.current) return;

    // Fix Leaflet's default icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });

    // Create the map centered on LPU
    const map = L.map(mapRef.current).setView(
      [LPU_COORDINATES.lat, LPU_COORDINATES.lng],
      16 // Zoom level
    );

    // Skip the standard tile layer and use only the satellite layer for satellite view
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "",
      }
    ).addTo(map);

    // Add marker for LPU main campus
    const lpuIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color:#4285F4; width:20px; height:20px; border-radius:50%; border:2px solid white;"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    L.marker([LPU_COORDINATES.lat, LPU_COORDINATES.lng], {
      icon: lpuIcon,
      title: "Lovely Professional University",
    }).addTo(map);

    // Store map reference
    leafletMapRef.current = map;

    // Add markers for mentors if they're already loaded
    if (nearbyMentors.length > 0) {
      addMentorMarkers(nearbyMentors);
    }

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);

          // Add marker for user location if not at LPU
          if (
            Math.abs(location.lat - LPU_COORDINATES.lat) > 0.01 ||
            Math.abs(location.lng - LPU_COORDINATES.lng) > 0.01
          ) {
            const userIcon = L.divIcon({
              className: "custom-div-icon",
              html: `<div style="background-color:#00FF00; width:16px; height:16px; border-radius:50%; border:2px solid white;"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.marker([location.lat, location.lng], {
              icon: userIcon,
              title: "Your Current Location",
            }).addTo(map);
          }
        },
        (err) => {
          console.error("Error getting location:", err);
          // Still show LPU location even if user location fails
        }
      );
    }

    // Cleanup when component unmounts
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isClient]);

  // Generate locations for mentors around LPU campus
  const generateLocationsForMentors = (mentors: any[]): MentorLocation[] => {
    // LPU campus locations for realistic placement
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
      const d = R * c;
      return d;
    };

    const deg2rad = (deg: number) => {
      return deg * (Math.PI / 180);
    };

    return mentors.map((mentor, index) => {
      // Use modulo to cycle through locations
      const locationIndex = index % lpuLocations.length;
      const location = lpuLocations[locationIndex];

      // Add slight randomization
      const latVariation = (Math.random() - 0.5) * 0.005; // About 500m in latitude
      const lngVariation = (Math.random() - 0.5) * 0.005; // About 500m in longitude

      const mentorLat = location.lat + latVariation;
      const mentorLng = location.lng + lngVariation;

      // Calculate distance from LPU center
      const distance = calculateDistance(
        LPU_COORDINATES.lat,
        LPU_COORDINATES.lng,
        mentorLat,
        mentorLng
      );

      return {
        id: mentor.id,
        name: `${mentor.firstName} ${mentor.lastName}`,
        avatar: mentor.image,
        role: mentor.mentorDetails?.jobTitle || "Mentor",
        specialties: mentor.mentorDetails?.specialties || [],
        interest: mentor.interest,
        rating: mentor.mentorDetails?.rating || 4.5,
        lat: mentorLat,
        lng: mentorLng,
        distance: parseFloat(distance.toFixed(2)),
        details: mentor.mentorDetails,
      };
    });
  };

  const addMentorMarkers = (mentors: MentorLocation[]) => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];

    // Add new markers
    mentors.forEach((mentor) => {
      // Create custom marker icon with mentor initials
      const initials = mentor.name
        .split(" ")
        .map((n) => n[0])
        .join("");

      const mentorIcon = L.divIcon({
        className: "mentor-icon",
        html: `
          <div style="background-color:#FF5722; width:32px; height:32px; border-radius:50%; border:2px solid white; display:flex; justify-content:center; align-items:center; color:white; font-weight:bold; font-size:12px;">
            ${initials}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Create marker
      const marker = L.marker([mentor.lat, mentor.lng], {
        icon: mentorIcon,
        title: mentor.name,
      }).addTo(leafletMapRef.current!);

      // Create rich popup with mentor details
      const popupContent = `
        <div style="max-width: 220px; padding: 10px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${mentor.avatar}" alt="${
        mentor.name
      }" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 10px;">
            <div>
              <h3 style="font-weight: bold; margin: 0; font-size: 16px;">${
                mentor.name
              }</h3>
              <p style="font-size: 12px; color: #666; margin: 0;">${
                mentor.role
              }</p>
            </div>
          </div>
          <div style="margin-bottom: 8px;">
            <p style="font-size: 13px; margin: 2px 0;"><strong>Interest:</strong> ${
              mentor.interest
            }</p>
            <p style="font-size: 13px; margin: 2px 0;"><strong>Company:</strong> ${
              mentor.details?.company || "Not specified"
            }</p>
            <p style="font-size: 13px; margin: 2px 0;"><strong>Experience:</strong> ${
              mentor.details?.experience || 0
            } years</p>
            <p style="font-size: 13px; margin: 2px 0;"><strong>Rating:</strong> ${mentor.rating.toFixed(
              1
            )} ⭐ (${mentor.details?.reviewCount || 0} reviews)</p>
          </div>
          <div style="margin-top: 8px;">
            <button
              onclick="window.location.href='/mentor/${mentor.id}'"
              style="background: #4F46E5; color: white; border: none; padding: 6px 12px; 
              border-radius: 4px; cursor: pointer; font-size: 13px; width: 100%;"
            >
              View Full Profile
            </button>
          </div>
        </div>
      `;

      // Add popup to marker
      marker.bindPopup(popupContent);

      // Add to markers ref for later cleanup
      markersRef.current.push(marker);
    });
  };

  const centerOnLPU = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(
        [LPU_COORDINATES.lat, LPU_COORDINATES.lng],
        16
      );
      setMapCenter(LPU_COORDINATES);
      toast.success("Map centered on Lovely Professional University");
    }
  };

  const centerOnUserLocation = () => {
    if (userLocation && leafletMapRef.current) {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 14);
      setMapCenter(userLocation);
      toast.success("Map centered on your location");
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Mentors With Similar Interests</CardTitle>
        {userInterest && (
          <div className="text-sm text-muted-foreground">
            Showing mentors interested in {userInterest}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px] w-full rounded-md border">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">
                  Loading mentors map...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2 max-w-xs text-center px-4">
                <MapPin className="h-8 w-8 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          <div
            ref={mapRef}
            className="absolute inset-0 overflow-hidden rounded-md"
          >
            {!isClient && (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            )}
          </div>

          <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-2">
            <Button
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={centerOnLPU}
              title="Center on LPU"
            >
              <MapPin className="h-4 w-4" />
            </Button>

            {userLocation && (
              <Button
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={centerOnUserLocation}
                title="Center on your location"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="absolute top-2 left-2 z-10 bg-background/90 rounded-md p-2 text-xs">
            <h3 className="font-medium mb-1">Mentors at LPU</h3>
            {!userInterest ? (
              <p className="text-muted-foreground">Loading interests...</p>
            ) : nearbyMentors.length === 0 ? (
              <p className="text-muted-foreground">No matching mentors found</p>
            ) : (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-primary" />
                <span>{nearbyMentors.length} mentors available</span>
              </div>
            )}
          </div>
        </div>

        {/* Add a list of mentor names below the map */}
        {nearbyMentors.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Available Mentors:</h4>
            <div className="grid grid-cols-2 gap-2">
              {nearbyMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="text-xs flex items-center gap-1"
                >
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>{mentor.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
