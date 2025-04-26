"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  student: {
    id: string;
    name: string;
  };
  files?: string[];
  [key: string]: any;
}

interface EditAssignmentDialogProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentUpdated?: () => void;
}

export function EditAssignmentDialog({
  assignment,
  open,
  onOpenChange,
  onAssignmentUpdated,
}: EditAssignmentDialogProps) {
  // Form state
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    assignment.dueDate ? parseISO(assignment.dueDate) : undefined
  );
  const [files, setFiles] = useState<string[]>(assignment.files || []);
  const [fileInput, setFileInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notifyStudent, setNotifyStudent] = useState(true);

  // Update local state when assignment prop changes
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setDueDate(assignment.dueDate ? parseISO(assignment.dueDate) : undefined);
      setFiles(assignment.files || []);
    }
  }, [assignment]);

  const addFileUrl = () => {
    if (fileInput.trim()) {
      setFiles([...files, fileInput.trim()]);
      setFileInput("");
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Form validation
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!dueDate) {
      toast.error("Please select a due date");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDate.toISOString(),
          files,
          notifyStudent, // Pass the notification preference
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update assignment");
      }

      toast.success("Assignment updated successfully");
      onOpenChange(false);

      if (onAssignmentUpdated) {
        onAssignmentUpdated();
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update assignment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Make changes to the assignment for {assignment.student.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter assignment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide assignment details and instructions"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className="min-h-[120px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="student">Student</Label>
            <Input
              id="student"
              value={assignment.student.name}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              The student cannot be changed for an existing assignment
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="dueDate"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="files">Files (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="files"
                placeholder="Enter file URL"
                value={fileInput}
                onChange={(e) => setFileInput(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addFileUrl}
                disabled={isLoading || !fileInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="truncate">{file}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyStudent"
              checked={notifyStudent}
              onCheckedChange={(checked) =>
                setNotifyStudent(checked as boolean)
              }
            />
            <Label htmlFor="notifyStudent" className="text-sm">
              Notify student about these changes
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
