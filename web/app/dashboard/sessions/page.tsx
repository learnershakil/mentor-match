"use client";

import { useState, useEffect } from "react";
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
import { SessionCard } from "@/components/sessions/session-card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

// Enhanced Session interface with additional fields from MentorMeeting model
interface Session {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: string;
  category: string;
  joinLink: string | null;
  notes: string | null; // Added field for meeting notes
  recordingUrl: string | null; // Added field for recorded sessions
  mentor?: {
    id?: string;
    name: string;
    image: string | null;
  };
  student?: {
    id?: string;
    name: string;
    image: string | null;
  };
}

export default function SessionsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || null;
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);

        // Fetch upcoming sessions using the new API
        const upcomingResponse = await fetch(
          "/api/common/upcoming-sessions?limit=50"
        );

        if (!upcomingResponse.ok) {
          throw new Error(
            `Failed to fetch upcoming sessions: ${upcomingResponse.status} ${upcomingResponse.statusText}`
          );
        }

        const upcomingData = await upcomingResponse.json();

        // Format the upcoming sessions data based on user role with additional fields
        const formattedUpcomingSessions =
          upcomingData.meetings?.map((meeting: any) => ({
            id: meeting.id,
            title: meeting.title,
            description: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            status: meeting.status,
            category: meeting.category,
            joinLink: meeting.joinLink,
            notes: meeting.notes, // Include notes from MentorMeeting
            recordingUrl: meeting.recordingUrl, // Include recording URL
            mentor:
              userRole === "STUDENT" && meeting.mentorship
                ? {
                    id: meeting.mentorship.id,
                    name: `${meeting.mentorship?.user?.firstName || ""} ${
                      meeting.mentorship?.user?.lastName || ""
                    }`.trim(),
                    image: meeting.mentorship?.user?.image,
                  }
                : undefined,
            student:
              userRole === "MENTOR"
                ? {
                    name: "Student", // Default value since we don't have student info
                    image: null,
                  }
                : undefined,
          })) || [];

        // For now, we'll just show the same data for past sessions
        // In a future update, you could create a separate API for past sessions
        const pastSessions = formattedUpcomingSessions.filter(
          (s: Session) => s.status === "COMPLETED"
        );

        const upcomingSess = formattedUpcomingSessions.filter(
          (s: Session) => s.status === "SCHEDULED"
        );

        setUpcomingSessions(upcomingSess);
        setPastSessions(pastSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load sessions");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchSessions();
    }
  }, [session, userRole]);

  // Map API data to component props
  const formatSessionForDisplay = (session: Session) => {
    return {
      id: session.id,
      title: session.title,
      description: session.description || undefined,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status as
        | "upcoming"
        | "completed"
        | "cancelled"
        | "scheduled"
        | "SCHEDULED"
        | "COMPLETED"
        | "CANCELLED",
      joinUrl: session.joinLink || undefined,
      category: session.category,
      notes: session.notes || undefined, // Pass notes to SessionCard
      recordingUrl: session.recordingUrl || undefined, // Pass recording URL
      mentor: session.mentor
        ? {
            ...session.mentor,
            id: session.mentor.id || "unknown",
            image: session.mentor.image || undefined,
          }
        : undefined,
      student: session.student
        ? {
            ...session.student,
            id: session.student.id || "unknown",
            image: session.student.image || undefined,
          }
        : undefined,
    };
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Mentoring Sessions"
        text="Join live sessions with your mentors"
      >
        <NotificationsButton />
      </DashboardHeader>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-0 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading sessions...</span>
            </div>
          ) : upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="flex h-[200px] items-center justify-center p-6">
                <div className="text-center">
                  <h3 className="mt-4 text-lg font-medium">
                    No upcoming sessions
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {userRole === "STUDENT"
                      ? "When mentors schedule sessions matching your interests, they'll appear here."
                      : "You haven't scheduled any upcoming sessions yet."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={formatSessionForDisplay(session)}
                // @ts-ignore
                userRole={userRole || "STUDENT"}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-0 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading sessions...</span>
            </div>
          ) : pastSessions.length === 0 ? (
            <Card>
              <CardContent className="flex h-[200px] items-center justify-center p-6">
                <div className="text-center">
                  <h3 className="mt-4 text-lg font-medium">No past sessions</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your completed sessions will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pastSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={formatSessionForDisplay(session)}
                // @ts-ignore
                userRole={userRole || "STUDENT"}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="recordings" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Session Recordings</CardTitle>
              <CardDescription>Rewatch your past sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No recordings available yet
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ChatbotCard />
    </DashboardShell>
  );
}
