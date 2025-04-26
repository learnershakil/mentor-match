"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  List,
  CalendarIcon,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { NotificationsButton } from "@/components/dashboard/notifications-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarSessionsList } from "@/components/calendar/calendar-sessions-list";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  type: "session" | "meeting" | "deadline";
  mentorName?: string;
  studentName?: string;
  category?: string; // Add category field
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [userInterest, setUserInterest] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  // Add a new state for the view
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Get first day of month, last day, and other calendar metadata
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCellsBefore = Array.from(
    { length: firstDayOfWeek },
    (_, i) => null
  );
  const calendarDays = [...emptyCellsBefore, ...days];

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
    type: "meeting" as "session" | "meeting" | "deadline",
    category: "",
  });

  // Fetch events for the current month
  useEffect(() => {
    fetchEvents();
  }, [currentDate, selectedInterest]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const startDate = format(firstDayOfMonth, "yyyy-MM-dd");
      const endDate = format(lastDayOfMonth, "yyyy-MM-dd");

      // Use the updated API endpoint for both user roles
      let endpoint = `/api/calendar/data?startDate=${startDate}&endDate=${endDate}`;
      
      // Add interest filter if selected
      if (selectedInterest) {
        endpoint += `&interest=${selectedInterest}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch calendar events");
      }

      const data = await response.json();

      // Save user interest for filters
      if (data.userInterest && !userInterest) {
        setUserInterest(data.userInterest);
      }

      // Transform the API data
      const formattedEvents: CalendarEvent[] = data.events.map(
        (event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description || "",
          date: new Date(event.startDate || event.date),
          time:
            event.time ||
            (event.startTime && event.endTime
              ? `${format(new Date(event.startTime), "h:mm a")} - ${format(
                  new Date(event.endTime),
                  "h:mm a"
                )}`
              : "All day"),
          type: event.type.toLowerCase(),
          mentorName: event.mentorName,
          studentName: event.studentName,
          category: event.category,
        })
      );

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load calendar events");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get events for a specific day
  const getEventsForDay = (day: number) => {
    if (!day) return [];

    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return events.filter((event) => isSameDay(event.date, date));
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Format month and year
  const formatMonthYear = (date: Date) => {
    return format(date, "MMMM yyyy");
  };

  // Handle day click to view or create events
  const handleDayClick = (day: number) => {
    if (!day) return;

    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const dayEvents = getEventsForDay(day);

    if (dayEvents.length > 0) {
      // If events exist, show the first one
      setSelectedEvent(dayEvents[0]);
      setIsEventDetailsOpen(true);
    } else if (session?.user.role !== "STUDENT") {
      // Only allow non-students to create events directly from calendar
      setNewEvent({
        ...newEvent,
        date: format(date, "yyyy-MM-dd"),
      });
      setIsAddEventOpen(true);
    }
  };

  // Submit new event
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const [startTime, endTime] = newEvent.time
        .split(" - ")
        .map((t) => t.trim());
      if (!startTime || !endTime) {
        toast.error("Please provide both start and end times");
        return;
      }

      // Format for API
      const payload = {
        title: newEvent.title,
        description: newEvent.description,
        startDate: newEvent.date,
        time: newEvent.time,
        type: newEvent.type,
        category: newEvent.category,
      };

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create event");
      }

      toast.success("Event created successfully");
      setIsAddEventOpen(false);

      // Reset form
      setNewEvent({
        title: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "",
        type: "meeting",
        category: "",
      });

      // Refresh events
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create event"
      );
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Calendar"
        text="View your scheduled sessions and deadlines"
      >
        <div className="flex items-center gap-2">
          {/* Add interest filter dropdown */}
          {userInterest && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Filter className="h-4 w-4" />
                  <span>
                    {selectedInterest ? selectedInterest : "Filter by Interest"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52">
                <div className="grid gap-2">
                  <Button
                    variant={!selectedInterest ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedInterest(null)}
                  >
                    All Interests
                  </Button>
                  {["WebDevelopment", "AiMl", "AppDevelopment", "CyberSecurity"].map(
                    (interest) => (
                      <Button
                        key={interest}
                        variant={selectedInterest === interest ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedInterest(interest)}
                      >
                        {interest}
                      </Button>
                    )
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setView(view === "calendar" ? "list" : "calendar")}
          >
            {view === "calendar" ? (
              <>
                <List className="h-4 w-4" />
                <span>List View</span>
              </>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar View</span>
              </>
            )}
          </Button>
          <NotificationsButton />
          {session?.user.role !== "STUDENT" && (
            <Button
              size="sm"
              className="gap-1"
              onClick={() => setIsAddEventOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Event</span>
            </Button>
          )}
        </div>
      </DashboardHeader>

      <Tabs defaultValue="view" className="mt-6">
        <TabsContent value="view" className="mt-0">
          {view === "calendar" ? (
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {formatMonthYear(currentDate)}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-7 gap-1">
                  {/* Day names */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-medium"
                      >
                        {day}
                      </div>
                    )
                  )}

                  {/* Loading placeholders */}
                  {Array.from({ length: 35 }).map((_, index) => (
                    <Skeleton key={index} className="min-h-24 rounded-md" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {/* Day names */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-medium"
                      >
                        {day}
                      </div>
                    )
                  )}

                  {/* Calendar days */}
                  {calendarDays.map((day, index) => {
                    const dayEvents = getEventsForDay(day as number);
                    const isToday =
                      day &&
                      new Date().getDate() === day &&
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === new Date().getFullYear();

                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-24 rounded-md border p-1",
                          isToday && "border-primary bg-primary/5",
                          !day && "bg-muted/30",
                          day && "cursor-pointer hover:bg-muted/50"
                        )}
                        onClick={() => day && handleDayClick(day as number)}
                      >
                        {day && (
                          <>
                            <div className="flex justify-end p-1">
                              <span
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                                  isToday &&
                                    "bg-primary text-primary-foreground"
                                )}
                              >
                                {day}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className={cn(
                                    "cursor-pointer rounded px-1 py-0.5 text-xs truncate",
                                    event.type === "session" &&
                                      "bg-primary/10 text-primary",
                                    event.type === "meeting" &&
                                      "bg-blue-500/10 text-blue-500",
                                    event.type === "deadline" &&
                                      "bg-red-500/10 text-red-500"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                    setIsEventDetailsOpen(true);
                                  }}
                                >
                                  {event.title}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-primary/80" />
                  <span className="text-xs">Mentoring Session</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500/80" />
                  <span className="text-xs">Meeting</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="text-xs">Deadline</span>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">All Sessions</h2>
                <div className="flex gap-2">
                  {/* Any specific controls for list view */}
                </div>
              </div>

              {/* List view component */}
              <CalendarSessionsList
                events={events}
                isLoading={isLoading}
                userRole={
                  session?.user.role === "MENTOR" ? "MENTOR" : "STUDENT"
                }
              />
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.date
                ? format(selectedEvent.date, "EEEE, MMMM d, yyyy")
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  selectedEvent?.type === "session" &&
                    "bg-primary/10 text-primary hover:bg-primary/20",
                  selectedEvent?.type === "meeting" &&
                    "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
                  selectedEvent?.type === "deadline" &&
                    "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                )}
              >
                {selectedEvent?.type === "session"
                  ? "Mentoring Session"
                  : selectedEvent?.type === "meeting"
                  ? "Meeting"
                  : "Deadline"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedEvent?.time}
              </span>
              
              {/* Display category/interest if available */}
              {selectedEvent?.category && (
                <Badge variant="outline" className="ml-2">
                  {selectedEvent.category}
                </Badge>
              )}
            </div>

            {/* Display mentor or student information based on user role */}
            {session?.user.role === "STUDENT" && selectedEvent?.mentorName && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Mentor:</span>
                <span className="text-sm">{selectedEvent.mentorName}</span>
              </div>
            )}

            {session?.user.role === "MENTOR" && selectedEvent?.studentName && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Student:</span>
                <span className="text-sm">{selectedEvent.studentName}</span>
              </div>
            )}

            <div className="rounded-lg border p-4">
              <p className="text-sm">{selectedEvent?.description}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEventDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event in your calendar
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                placeholder="Enter event title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newEvent.date && "text-muted-foreground"
                    )}
                    id="date"
                  >
                    {newEvent.date
                      ? format(parseISO(newEvent.date), "PPP")
                      : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarPicker
                    mode="single"
                    selected={
                      newEvent.date ? parseISO(newEvent.date) : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      setNewEvent({
                        ...newEvent,
                        date: format(date, "yyyy-MM-dd"),
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select
                  value={newEvent.time.split(" - ")[0] || ""}
                  onValueChange={(time) => {
                    const [_, endTime] = newEvent.time.split(" - ");
                    setNewEvent({
                      ...newEvent,
                      time: `${time}${endTime ? ` - ${endTime}` : ""}`,
                    });
                  }}
                >
                  <SelectTrigger id="startTime">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 })
                      .map((_, hour) =>
                        [0, 30].map((minute) => {
                          const formattedHour = hour % 12 || 12;
                          const period = hour < 12 ? "AM" : "PM";
                          const formattedTime = `${formattedHour}:${
                            minute === 0 ? "00" : minute
                          } ${period}`;
                          return (
                            <SelectItem
                              key={`${hour}-${minute}`}
                              value={formattedTime}
                            >
                              {formattedTime}
                            </SelectItem>
                          );
                        })
                      )
                      .flat()}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select
                  value={newEvent.time.split(" - ")[1] || ""}
                  onValueChange={(time) => {
                    const [startTime] = newEvent.time.split(" - ");
                    setNewEvent({
                      ...newEvent,
                      time: `${startTime ? `${startTime} - ` : ""}${time}`,
                    });
                  }}
                >
                  <SelectTrigger id="endTime">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 })
                      .map((_, hour) =>
                        [0, 30].map((minute) => {
                          const formattedHour = hour % 12 || 12;
                          const period = hour < 12 ? "AM" : "PM";
                          const formattedTime = `${formattedHour}:${
                            minute === 0 ? "00" : minute
                          } ${period}`;
                          return (
                            <SelectItem
                              key={`${hour}-${minute}`}
                              value={formattedTime}
                            >
                              {formattedTime}
                            </SelectItem>
                          );
                        })
                      )
                      .flat()}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value: "session" | "meeting" | "deadline") =>
                  setNewEvent({ ...newEvent, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Mentoring Session</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add category/interest field */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newEvent.category || userInterest || "WebDevelopment"}
                onValueChange={(value) =>
                  setNewEvent({ ...newEvent, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WebDevelopment">Web Development</SelectItem>
                  <SelectItem value="AiMl">AI & Machine Learning</SelectItem>
                  <SelectItem value="AppDevelopment">App Development</SelectItem>
                  <SelectItem value="CyberSecurity">Cyber Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add event details"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatbotCard />
    </DashboardShell>
  );
}
