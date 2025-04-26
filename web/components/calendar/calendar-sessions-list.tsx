"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Calendar, Clock, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  type: "session" | "meeting" | "deadline";
  studentName?: string;
  mentorName?: string;
}

interface CalendarSessionsListProps {
  events: CalendarEvent[];
  isLoading: boolean;
  userRole?: "MENTOR" | "STUDENT" | "ADMIN";
  className?: string;
}

export function CalendarSessionsList({
  events,
  isLoading,
  userRole = "STUDENT",
  className,
}: CalendarSessionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description &&
        event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.studentName &&
        event.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.mentorName &&
        event.mentorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatEventDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col gap-2 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No events found matching your search"
              : "No events scheduled"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col gap-1 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{event.title}</h3>
                    <Badge
                      className={cn(
                        "rounded-sm text-xs",
                        event.type === "session" &&
                          "bg-primary/10 text-primary hover:bg-primary/20",
                        event.type === "meeting" &&
                          "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
                        event.type === "deadline" &&
                          "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      )}
                    >
                      {event.type === "session"
                        ? "Session"
                        : event.type === "meeting"
                        ? "Meeting"
                        : "Deadline"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {event.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{event.time}</span>
                    </div>
                    {userRole === "MENTOR" && event.studentName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>Student: {event.studentName}</span>
                      </div>
                    )}
                    {userRole === "STUDENT" && event.mentorName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>Mentor: {event.mentorName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
