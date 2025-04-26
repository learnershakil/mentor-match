"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ScheduleSessionModalProps {
  mentor: {
    id: number
    name: string
    image: string
    availability?: {
      day: string
      slots: string[]
    }[]
  }
  isOpen: boolean
  onClose: () => void
}

export function ScheduleSessionModal({ mentor, isOpen, onClose }: ScheduleSessionModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [timeSlot, setTimeSlot] = useState<string>("")
  const [topic, setTopic] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get available time slots for the selected date
  const getAvailableTimeSlots = () => {
    if (!date) return []

    const dayName = format(date, "EEEE")
    const dayAvailability = mentor.availability?.find((a) => a.day === dayName)

    return dayAvailability?.slots || []
  }

  const handleSubmit = () => {
    if (!date) {
      toast.error("Please select a date")
      return
    }

    if (!timeSlot) {
      toast.error("Please select a time slot")
      return
    }

    if (!topic) {
      toast.error("Please enter a session topic")
      return
    }

    setIsSubmitting(true)

    // Simulate scheduling
    setTimeout(() => {
      setIsSubmitting(false)
      onClose()
      toast.success("Session scheduled successfully!")
    }, 1500)
  }

  const availableTimeSlots = getAvailableTimeSlots()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Session with {mentor.name}</DialogTitle>
          <DialogDescription>Select a date and time for your mentoring session</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
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
                  disabled={(date) => {
                    // Disable past dates and weekends
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Time Slot</label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No available slots for this day
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Session Topic</label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="react">React Components</SelectItem>
                <SelectItem value="javascript">JavaScript Fundamentals</SelectItem>
                <SelectItem value="api">API Integration</SelectItem>
                <SelectItem value="database">Database Design</SelectItem>
                <SelectItem value="career">Career Guidance</SelectItem>
                <SelectItem value="project">Project Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Additional Notes (Optional)</label>
            <Textarea
              placeholder="Add any specific questions or topics you'd like to discuss"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Scheduling..." : "Schedule Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

