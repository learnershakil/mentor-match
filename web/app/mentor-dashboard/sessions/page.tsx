"use client";

import { useState, useEffect } from "react";
import { MentorDashboardHeader } from "@/components/mentor-dashboard/mentor-dashboard-header";
import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
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
import { Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: string;
  category: string;
  joinLink: string | null;
  student?: {
    id?: string;
    name: string;
    image: string | null;
  };
}

export default function MentorSessionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
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

        // Format the upcoming sessions data
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
            student: {
              name: meeting.mentorship?.user?.firstName
                ? `${meeting.mentorship?.user?.firstName || ""} ${
                    meeting.mentorship?.user?.lastName || ""
                  }`.trim()
                : "Student",
              image: meeting.mentorship?.user?.image,
            },
          })) || [];

        // Filter for upcoming and past sessions
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
  }, [session]);

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
      student: session.student
        ? {
            ...session.student,
            id: session.student.id || "unknown",
            image: session.student.image || undefined,
          }
        : undefined,
    };
  };

  const handleCreateSession = () => {
    router.push("/mentor-dashboard/calendar");
  };

  return (
    <MentorDashboardShell>
      <MentorDashboardHeader
        heading="My Sessions"
        text="Manage your mentoring sessions with students"
      >
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateSession}>
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
          <NotificationsButton />
        </div>
      </MentorDashboardHeader>

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
                    You haven't scheduled any upcoming sessions yet.
                  </p>
                  <Button onClick={handleCreateSession} className="mt-4">
                    Schedule a Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={formatSessionForDisplay(session)}
                userRole="MENTOR"
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
                userRole="MENTOR"
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="recordings" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Session Recordings</CardTitle>
              <CardDescription>
                Share recordings of your past sessions
              </CardDescription>
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
    </MentorDashboardShell>
  );
}
