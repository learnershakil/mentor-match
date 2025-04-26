"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { NotificationsButton } from "@/components/dashboard/notifications-button";
import { MentorCard } from "@/components/mentors/mentor-card";
import { toast } from "sonner";

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInterest, setUserInterest] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/interest");

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setUserInterest(data.currentUserInterest);

        // Format the mentors data to match what MentorCard expects
        const formattedMentors = data.matchingUsers.map((user: any) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.mentorDetails?.jobTitle || "Mentor",
          company: user.mentorDetails?.company || "",
          image: user.image,
          bio: user.bio || "",
          rating: user.mentorDetails?.rating || 4.5,
          reviews: user.mentorDetails?.reviewCount || 0,
          specialties: user.mentorDetails?.specialties || [],
          // Note: Next Session data would need to come from a separate API
          nextSession: {
            title: "Check mentor's calendar",
            date: "See availability",
            time: "Contact for details",
          },
          // Availability would come from parsing the JSON string in mentorDetails.availability
          availability: user.mentorDetails?.availability
            ? tryParseAvailability(user.mentorDetails.availability)
            : defaultAvailability(),
        }));

        setMentors(formattedMentors);
      } catch (error) {
        console.error("Error fetching mentors:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load mentors"
        );
        toast.error("Failed to load mentors data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, []);

  // Helper function to parse availability JSON
  const tryParseAvailability = (availabilityStr: string) => {
    try {
      const parsed = JSON.parse(availabilityStr);
      const availabilityArr = [];

      if (parsed.days) {
        // Convert the days object to the format expected by MentorCard
        for (const [day, available] of Object.entries(parsed.days)) {
          if (available) {
            availabilityArr.push({
              day: day.charAt(0).toUpperCase() + day.slice(1),
              slots: ["9:00 AM - 5:00 PM"], // Default time slot
            });
          }
        }
      }

      return availabilityArr.length > 0
        ? availabilityArr
        : defaultAvailability();
    } catch (e) {
      console.warn("Error parsing availability:", e);
      return defaultAvailability();
    }
  };

  // Default availability if none is provided
  const defaultAvailability = () => [
    { day: "Monday", slots: ["9:00 AM - 5:00 PM"] },
    { day: "Wednesday", slots: ["9:00 AM - 5:00 PM"] },
    { day: "Friday", slots: ["9:00 AM - 5:00 PM"] },
  ];

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Your Mentors"
        text={
          userInterest
            ? `Mentors who share your interest in ${userInterest}`
            : "Connect with mentors who share your interests"
        }
      >
        <NotificationsButton />
      </DashboardHeader>

      <Tabs defaultValue="assigned" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="assigned">Matching Mentors</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="mt-0 space-y-6">
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              <p>{error}</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="bg-muted p-4 rounded-md">
              <p>No mentors found with matching interests.</p>
            </div>
          ) : (
            mentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                hideScheduleSession={true} // Added to hide the Schedule Session button
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Additional Options</CardTitle>
            <CardDescription>
              To get the most out of your mentorship experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Next Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View your upcoming mentoring sessions and prepare for them.
                  </p>
                    <button 
                    onClick={() => window.location.href = "/dashboard/sessions"}
                    className="mt-3 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                    View Sessions
                    </button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Message Mentors</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Connect directly with your mentors via our messaging system.
                  </p>
                  <button onClick={() => window.location.href = "/dashboard/messages"} className="mt-3 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    Open Messages
                  </button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChatbotCard />
    </DashboardShell>
  );
}
