"use client";

import { useState, useEffect, ReactNode } from "react";
import { CalendarPlus, CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format, addHours } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ScheduleSessionButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  label?: string;
  showIcon?: boolean;
  className?: string;
  children?: ReactNode;
  specificStudentId?: string; // New prop for pre-selecting a student
}

interface Interest {
  value: string;
  label: string;
}

interface Student {
  id: string;
  name: string;
}

const INTERESTS: Interest[] = [
  { value: "WebDevelopment", label: "Web Development" },
  { value: "AiMl", label: "AI & Machine Learning" },
  { value: "AppDevelopment", label: "App Development" },
  { value: "CyberSecurity", label: "Cyber Security" },
];

export function ScheduleSessionButton({
  variant = "default",
  size = "default",
  label = "Schedule Session",
  showIcon = false,
  className,
  children,
  specificStudentId,
}: ScheduleSessionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [studentId, setStudentId] = useState(specificStudentId || "");

  // Set default times when opening the dialog
  useEffect(() => {
    if (open) {
      // Set default times if they're not set yet
      if (!startTime) {
        const now = new Date();
        const roundedHour = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours() + 1,
          0,
          0
        );
        setStartTime(format(roundedHour, "HH:mm"));
        setEndTime(format(addHours(roundedHour, 1), "HH:mm"));
      }
    }
  }, [open, startTime]);

  // Fetch students with matching interests
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const response = await fetch("/api/assignments/students");
        if (!response.ok) {
          throw new Error("Failed to fetch students");
        }
        const data = await response.json();
        setStudents(data.students || []);

        // If specificStudentId is provided, set it
        if (specificStudentId && !studentId) {
          setStudentId(specificStudentId);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    if (open) {
      fetchStudents();
    }
  }, [open, specificStudentId, studentId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setSessionDate(undefined);
    // Only reset times if dialog is reopened
    // setStartTime("");
    // setEndTime("");
    setJoinLink("");

    // Only reset studentId if not using specificStudentId
    if (!specificStudentId) {
      setStudentId("");
    }
  };

  const handleSubmit = async () => {
    // Form validation
    if (!title.trim()) {
      toast.error("Please enter a session title");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!sessionDate) {
      toast.error("Please select a date");
      return;
    }
    if (!startTime) {
      toast.error("Please set a start time");
      return;
    }
    if (!endTime) {
      toast.error("Please set an end time");
      return;
    }

    // Create datetime objects
    const startDateTime = new Date(sessionDate);
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes);

    const endDateTime = new Date(sessionDate);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    endDateTime.setHours(endHours, endMinutes);

    // Validate time range
    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/mentor/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          joinLink: joinLink || undefined,
          studentId: studentId || undefined, // Include studentId if provided
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create session");
      }

      const data = await response.json();

      // Success message based on notification count
      if (data.notifiedStudents > 0) {
        toast.success(
          `Session created and ${data.notifiedStudents} students notified`
        );
      } else {
        toast.success("Session created successfully");
      }

      setOpen(false);
      resetForm();
      router.refresh();

      // If this was scheduled for a specific student, go back to their profile
      if (specificStudentId) {
        router.push(`/mentor-dashboard/students/${specificStudentId}`);
      }
    } catch (error) {
      console.error("Error scheduling session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to schedule session"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant={variant} size={size} className={className}>
            {showIcon && <CalendarPlus className="mr-2 h-4 w-4" />}
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule a Session</DialogTitle>
          <DialogDescription>
            {specificStudentId
              ? "Schedule a new mentoring session with this student"
              : "Set up a new mentoring session for students to join"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              placeholder="e.g., Introduction to React Hooks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What will you cover in this session?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={isLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {INTERESTS.map((interest) => (
                    <SelectItem key={interest.value} value={interest.value}>
                      {interest.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {specificStudentId ? null : (
              <div className="grid gap-2">
                <Label htmlFor="student">Student (Optional)</Label>
                <Select
                  value={studentId}
                  onValueChange={setStudentId}
                  disabled={isLoading || studentsLoading}
                >
                  <SelectTrigger id="student">
                    <SelectValue
                      placeholder={
                        studentsLoading
                          ? "Loading students..."
                          : "Select a student"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any student can join</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !sessionDate && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? format(sessionDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={setSessionDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="joinLink">Meeting Link (Optional)</Label>
            <Input
              id="joinLink"
              placeholder="e.g., https://zoom.us/j/123456789"
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              You can add this now or update it later
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
