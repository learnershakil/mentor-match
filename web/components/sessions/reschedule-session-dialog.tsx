"use client";

import { useState, ReactNode } from "react";
import { format, addHours, isAfter } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RescheduleSessionDialogProps {
  children: ReactNode;
  sessionId: string;
  currentDate?: Date | string;
  currentStartTime?: string;
  currentEndTime?: string;
}

export function RescheduleSessionDialog({
  children,
  sessionId,
  currentDate,
  currentStartTime,
  currentEndTime,
}: RescheduleSessionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize with current values if provided
  const defaultDate = currentDate ? new Date(currentDate) : new Date();
  const parsedStartTime = currentStartTime
    ? currentStartTime.split(" - ")[0].trim()
    : format(new Date(), "h:mm a");
  const parsedEndTime = currentEndTime
    ? currentEndTime.split(" - ")[1].trim()
    : format(addHours(new Date(), 1), "h:mm a");

  // Convert to 24-hour format for input fields
  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    if (hours === "12") {
      hours = "00";
    }

    if (modifier === "PM") {
      hours = (parseInt(hours, 10) + 12).toString();
    }

    // Ensure proper formatting with leading zeros
    return `${hours.padStart(2, "0")}:${minutes || "00"}`;
  };

  // Form states
  const [date, setDate] = useState<Date | undefined>(defaultDate);
  const [startTime, setStartTime] = useState(convertTo24Hour(parsedStartTime));
  const [endTime, setEndTime] = useState(convertTo24Hour(parsedEndTime));
  const [notifyStudents, setNotifyStudents] = useState(true);

  const handleSubmit = async () => {
    // Validate form
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    if (!startTime || !endTime) {
      toast.error("Please set both start and end times");
      return;
    }

    // Create datetime objects from date and time inputs
    const startDateTime = new Date(date);
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes, 0);

    const endDateTime = new Date(date);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    endDateTime.setHours(endHours, endMinutes, 0);

    // Validate start time is before end time
    if (startDateTime >= endDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    // Validate session is in the future
    if (startDateTime <= new Date()) {
      toast.error("Session must be rescheduled to a future date and time");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/mentor/sessions/${sessionId}/reschedule/route`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            notifyStudents,
          }),
        }
      );

      // Improved error handling
      if (!response.ok) {
        const contentType = response.headers.get("content-type");

        // Check if response is JSON
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to reschedule session");
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          console.error("Non-JSON response:", text);
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const data = await response.json();

      // Success
      toast.success(
        notifyStudents
          ? "Session rescheduled successfully! Notifications sent to students."
          : "Session rescheduled successfully!"
      );

      setOpen(false);
      router.refresh(); // Refresh the page to show updated session
    } catch (error) {
      console.error("Error rescheduling session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reschedule session"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reschedule Session</DialogTitle>
          <DialogDescription>
            Update the date and time for this session
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">New Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="notify"
              checked={notifyStudents}
              onChange={(e) => setNotifyStudents(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="notify" className="text-sm font-normal">
              Notify students with matching interests about this change
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Reschedule Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
