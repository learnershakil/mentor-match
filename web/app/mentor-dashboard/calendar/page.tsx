"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  X,
  List,
  CalendarIcon,
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

import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
import { MentorDashboardHeader } from "@/components/mentor-dashboard/mentor-dashboard-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarSessionsList } from "@/components/calendar/calendar-sessions-list";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  type: "session" | "meeting" | "deadline";
  studentId?: string;
  studentName?: string;
}

interface Student {
  id: string;
  name: string;
}

export default function MentorCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "session",
    studentId: "",
  });

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

  // Fetch events for the current month
  useEffect(() => {
    fetchEvents();
    fetchStudents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const startDate = format(firstDayOfMonth, "yyyy-MM-dd");
      const endDate = format(lastDayOfMonth, "yyyy-MM-dd");

      const response = await fetch(
        `/api/mentor/calendar?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch calendar events");
      }

      const data = await response.json();

      // Transform the API data
      const formattedEvents: CalendarEvent[] = data.events.map(
        (event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description || "",
          date: new Date(event.startDate || event.date),
          time:
            event.time ||
            (event.startTime
              ? `${format(parseISO(event.startTime), "h:mm a")} - ${format(
                  parseISO(event.endTime),
                  "h:mm a"
                )}`
              : "All day"),
          type: event.type.toLowerCase(),
          studentId: event.studentId,
          studentName: event.studentName,
        })
      );

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load calendar events");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Clear students array to properly show loading state
      setStudents([]);

      // First try the dedicated calendar students endpoint
      let response = await fetch("/api/mentor/calendar/students");
      let fetchSuccessful = false;
      let data;

      if (!response.ok) {
        console.warn(
          "Calendar students endpoint failed, trying general students endpoint as fallback"
        );
        // Fall back to the general students endpoint
        response = await fetch("/api/mentor/students");

        if (response.ok) {
          data = await response.json();
          fetchSuccessful = true;
        }
      } else {
        data = await response.json();
        fetchSuccessful = true;
      }

      if (!fetchSuccessful) {
        throw new Error("Failed to fetch students from any endpoint");
      }

      // Transform and normalize the student data regardless of which endpoint was used
      if (data && data.students && Array.isArray(data.students)) {
        const formattedStudents = data.students.map((student) => ({
          id: student.id || "",
          name:
            student.name ||
            `${student.user?.firstName || ""} ${
              student.user?.lastName || ""
            }`.trim() ||
            "Unknown Student",
          // Handle different data structures from different endpoints
          interests: student.interests || student.learningInterests || [],
        }));

        setStudents(formattedStudents);

        if (formattedStudents.length === 0) {
          console.log("No students found with matching interests");
          toast.warning(
            "No students with matching interests found. You can still create events without specifying a student."
          );
        }
      } else {
        // Handle unexpected response format
        console.error("Invalid student data format:", data);
        setStudents([]);
        toast.error("Received invalid student data format");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      // Set empty array to avoid infinite loading state
      setStudents([]);
      toast.error(
        "Failed to load students. You can still create events without specifying a student."
      );
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
    } else {
      // If no events, open the create event dialog
      setSelectedDate(date);
      setNewEvent({
        ...newEvent,
        date: format(date, "yyyy-MM-dd"),
      });
      setIsEditMode(false);
      setIsEventDialogOpen(true);
    }
  };

  // Handle opening the create event dialog
  const handleOpenCreateDialog = () => {
    const today = new Date();
    setSelectedDate(today);
    setNewEvent({
      title: "",
      description: "",
      date: format(today, "yyyy-MM-dd"),
      time: "",
      type: "session",
      studentId: "",
    });
    setIsEditMode(false);
    setIsEventDialogOpen(true);
  };

  // Handle edit event
  const handleEditEvent = () => {
    if (!selectedEvent) return;

    setNewEvent({
      title: selectedEvent.title,
      description: selectedEvent.description,
      date: format(selectedEvent.date, "yyyy-MM-dd"),
      time: selectedEvent.time,
      type: selectedEvent.type,
      studentId: selectedEvent.studentId || "",
    });

    setIsEditMode(true);
    setIsEventDetailsOpen(false);
    setIsEventDialogOpen(true);
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/mentor/calendar/${selectedEvent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast.success("Event deleted successfully");
      setIsEventDetailsOpen(false);
      fetchEvents(); // Refresh the events
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle create or edit event submission
  const handleSubmitEvent = async () => {
    // Form validation
    if (!newEvent.title) {
      toast.error("Please enter an event title");
      return;
    }

    if (!newEvent.date) {
      toast.error("Please select a date");
      return;
    }

    // Additional validation for time
    const [startTime, endTime] = newEvent.time.split(" - ");
    if (!startTime || !endTime) {
      toast.error("Please select both start and end times");
      return;
    }

    // Make student selection optional for more flexibility
    if (
      (newEvent.type === "session" ||
        newEvent.type === "meeting" ||
        newEvent.type === "deadline") &&
      !newEvent.studentId &&
      students.length > 0
    ) {
      // Ask for confirmation rather than blocking
      if (
        !confirm(`Create this ${newEvent.type} without assigning a student?`)
      ) {
        return;
      }
    }

    try {
      setIsCreating(true);

      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `/api/mentor/calendar/${selectedEvent?.id}`
        : "/api/mentor/calendar";

      const payload = {
        ...newEvent,
        startDate: newEvent.date,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save event");
      }

      toast.success(
        isEditMode ? "Event updated successfully" : "Event created successfully"
      );
      setIsEventDialogOpen(false);
      fetchEvents(); // Refresh the events

      // Reset form
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        type: "session",
        studentId: "",
      });
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save event"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <MentorDashboardShell>
      <MentorDashboardHeader
        heading="Calendar"
        text="Manage your schedule and upcoming events"
      >
        <div className="flex items-center gap-2">
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
          <Button size="sm" className="gap-1" onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </Button>
        </div>
      </MentorDashboardHeader>

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

              {/* Existing calendar grid view */}
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
                      new Date().getFullYear() === currentDate.getFullYear();

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
                  {/* Add any specific controls for list view here */}
                </div>
              </div>

              {/* List view component */}
              <CalendarSessionsList
                events={events}
                isLoading={isLoading}
                userRole="MENTOR"
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
            </div>

            {selectedEvent?.studentName && (
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
              disabled={isDeleting}
            >
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleEditEvent}
                disabled={isDeleting}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Event" : "Add New Event"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the details of your calendar event"
                : "Create a new event in your calendar"}
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
                onValueChange={(value) =>
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

            {(newEvent.type === "session" ||
              newEvent.type === "meeting" ||
              newEvent.type === "deadline") && (
              <div className="grid gap-2">
                <Label htmlFor="student">Student</Label>
                {students.length === 0 ? (
                  <div className="flex items-center space-x-2 h-10 px-3 py-2 text-sm border rounded-md bg-muted/20">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading students...</span>
                  </div>
                ) : (
                  <Select
                    value={newEvent.studentId}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, studentId: value })
                    }
                  >
                    <SelectTrigger id="student">
                      <SelectValue
                        placeholder={
                          students.length === 0
                            ? "No students found"
                            : "Select a student"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length > 0 ? (
                        students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                            {student.interests &&
                              student.interests.length > 0 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (
                                  {Array.isArray(student.interests)
                                    ? student.interests.slice(0, 2).join(", ") +
                                      (student.interests.length > 2
                                        ? "..."
                                        : "")
                                    : student.interests}
                                  )
                                </span>
                              )}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-students" disabled>
                          No students available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {students.length === 0 && !isLoading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You can create an event without selecting a student
                  </p>
                )}
              </div>
            )}

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
            <Button
              variant="outline"
              onClick={() => setIsEventDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEvent} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Update Event"
              ) : (
                "Add Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatbotCard />
    </MentorDashboardShell>
  );
}
