"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import { ArrowUpRight, Calendar, Clock, Loader2, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

interface UpcomingSessionsCardProps {
  className?: string;
  limit?: number;
}

type Session = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  joinLink?: string;
  category: string;
  mentor?: {
    name: string;
    image?: string;
  };
  student?: {
    name: string;
    image?: string;
  };
};

export function UpcomingSessionsCard({
  className,
  limit = 3,
}: UpcomingSessionsCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);

  const userRole = session?.user?.role || null;

  // Fetch upcoming sessions for the user
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use the new common API endpoint for upcoming sessions
        const endpoint = `/api/common/upcoming-sessions?limit=${limit}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch upcoming sessions: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        // Format the sessions data based on the correct relationship field names
        const formattedSessions =
          data.meetings?.map((meeting: any) => ({
            id: meeting.id,
            title: meeting.title,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            status: meeting.status,
            joinLink: meeting.joinLink || "#",
            category: meeting.category,
            mentor:
              userRole === "STUDENT" && meeting.mentorship
                ? {
                    name: `${meeting.mentorship?.user?.firstName || ""} ${
                      meeting.mentorship?.user?.lastName || ""
                    }`.trim(),
                    image: meeting.mentorship?.user?.image,
                  }
                : undefined,
            student:
              userRole === "MENTOR"
                ? {
                    name: "Student", // Default name since we don't have student info in this query
                    image: undefined,
                  }
                : undefined,
          })) || [];

        setUpcomingSessions(formattedSessions);
      } catch (error) {
        console.error("Error fetching upcoming sessions:", error);
        setError("Failed to load upcoming sessions");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchSessions();
    }
  }, [session, userRole, limit]);

  // Display the category in a more readable format
  const formatCategory = (category: string) => {
    // Insert spaces before capital letters and capitalize the first letter
    return category
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const handleViewAllSessions = () => {
    const dashboardPath =
      userRole === "MENTOR"
        ? "/mentor-dashboard/sessions"
        : "/dashboard/sessions";
    router.push(dashboardPath);
  };

  const handleJoinSession = (joinLink: string) => {
    if (joinLink === "#") {
      toast.error("Session not started yet");
      return;
    }

    window.open(joinLink, "_blank");
  };

  // Format the session time (e.g., "Today at 3:00 PM" or "May 15 at 10:00 AM")
  const formatSessionTime = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isToday(start)) {
        return `Today, ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
      }

      return `${format(start, "MMM d")}, ${format(start, "h:mm a")} - ${format(
        end,
        "h:mm a"
      )}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Time not available";
    }
  };

  const getSessionStatusBadge = (status: string, startTime: string) => {
    const start = new Date(startTime);

    if (status === "CANCELLED") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }

    if (status === "RESCHEDULED") {
      return <Badge variant="warning">Rescheduled</Badge>;
    }

    if (isPast(start)) {
      return <Badge variant="outline">Completed</Badge>;
    }

    if (isToday(start)) {
      return <Badge variant="default">Today</Badge>;
    }

    return <Badge variant="secondary">Upcoming</Badge>;
  };

  const renderSessionsContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg border p-4"
            >
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.refresh()}
          >
            Try again
          </Button>
        </div>
      );
    }

    if (upcomingSessions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() =>
              router.push(
                userRole === "MENTOR"
                  ? "/mentor-dashboard/calendar"
                  : "/dashboard/mentors"
              )
            }
          >
            {userRole === "MENTOR" ? "Schedule a session" : "Find a mentor"}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {upcomingSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <Avatar className="h-10 w-10">
              {userRole === "STUDENT" && session.mentor ? (
                <>
                  <AvatarImage
                    src={session.mentor.image || "/placeholder.svg"}
                    alt={session.mentor.name}
                  />
                  <AvatarFallback>
                    {session.mentor.name.charAt(0)}
                  </AvatarFallback>
                </>
              ) : userRole === "MENTOR" && session.student ? (
                <>
                  <AvatarImage
                    src={session.student.image || "/placeholder.svg"}
                    alt={session.student.name}
                  />
                  <AvatarFallback>
                    {session.student.name.charAt(0)}
                  </AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src="/placeholder.svg" alt="Session" />
                  <AvatarFallback>S</AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{session.title}</p>
                {getSessionStatusBadge(session.status, session.startTime)}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {formatSessionTime(session.startTime, session.endTime)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Category:</span>{" "}
                {formatCategory(session.category)}
              </div>
              {userRole === "STUDENT" && session.mentor && (
                <p className="text-xs text-muted-foreground">
                  With {session.mentor.name}
                </p>
              )}
              {userRole === "MENTOR" && session.student && (
                <p className="text-xs text-muted-foreground">
                  With {session.student.name}
                </p>
              )}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleJoinSession(session.joinLink || "#")}
                >
                  <Video className="mr-1 h-3 w-3" />
                  Join Session
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Upcoming Sessions</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 h-8"
          onClick={handleViewAllSessions}
        >
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>{renderSessionsContent()}</CardContent>
    </Card>
  );
}
