import Link from "next/link";
import { Calendar, Clock, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleSessionButton } from "@/components/sessions/schedule-session-button";

interface UpcomingSession {
  id: string;
  title: string;
  studentName?: string;
  studentAvatar?: string;
  date: string | Date;
  time: string;
  joinUrl: string;
}

interface MentorScheduleCardProps {
  className?: string;
  sessions: UpcomingSession[];
  isLoading?: boolean;
}

export function MentorScheduleCard({
  className,
  sessions,
  isLoading = false,
}: MentorScheduleCardProps) {
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: string | Date) => {
    if (typeof date === "string") {
      if (date.toLowerCase() === "today" || date.toLowerCase() === "tomorrow") {
        return date;
      }
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Sessions</CardTitle>
        <ScheduleSessionButton
          variant="ghost"
          size="sm"
          showIcon={true}
          label="Create New"
        />
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              No upcoming sessions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div className="flex gap-3">
                  {session.studentAvatar && (
                    <Avatar className="mt-1 h-8 w-8">
                      <AvatarImage
                        src={session.studentAvatar}
                        alt={session.studentName || "Student"}
                      />
                      <AvatarFallback>
                        {session.studentName
                          ? session.studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : "S"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div className="font-medium">{session.title}</div>
                    {session.studentName && (
                      <div className="text-sm text-muted-foreground">
                        with {session.studentName}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(session.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{session.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1"
                  asChild
                >
                  <Link href={session.joinUrl}>
                    <Video className="h-3.5 w-3.5" />
                    <span>Join</span>
                  </Link>
                </Button>
              </div>
            ))}
            <div className="text-center">
              <Button variant="link" asChild>
                <Link href="/mentor-dashboard/sessions">View all sessions</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
