"use client";

import { useState, useEffect, ReactNode } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
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

interface CreateAssignmentDialogProps {
  children: ReactNode;
  className?: string;
  specificStudentId?: string; // Pre-selecting a student
  onAssignmentCreated?: () => void;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  image?: string;
  interests?: string[];
  level?: string;
}

export function CreateAssignmentDialog({
  children,
  className,
  specificStudentId,
  onAssignmentCreated,
}: CreateAssignmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [mentorInterests, setMentorInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [studentId, setStudentId] = useState(specificStudentId || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    addDays(new Date(), 7)
  );
  const [files, setFiles] = useState<string[]>([]);
  const [fileInput, setFileInput] = useState("");
  const [notifyStudent, setNotifyStudent] = useState(true);

  // Fetch students with matching interests
  useEffect(() => {
    const fetchStudents = async () => {
      if (!open) return;

      try {
        setStudentsLoading(true);
        setError(null);

        const response = await fetch("/api/assignments/students");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch students");
        }

        const data = await response.json();

        if (data.students && Array.isArray(data.students)) {
          setStudents(data.students);

          if (data.mentorInterests) {
            setMentorInterests(data.mentorInterests);
          }

          // If no students were found despite the API call succeeding
          if (data.students.length === 0) {
            setError("No students with matching interests found");
          }
        } else {
          throw new Error("Invalid response format");
        }

        // If specificStudentId is provided, set it
        if (specificStudentId && !studentId) {
          setStudentId(specificStudentId);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load students"
        );
        toast.error("Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [open, specificStudentId, studentId]);

  const addFileUrl = () => {
    if (fileInput.trim()) {
      setFiles([...files, fileInput.trim()]);
      setFileInput("");
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    // Only reset studentId if not using specificStudentId
    if (!specificStudentId) {
      setStudentId("");
    }
    setDueDate(addDays(new Date(), 7));
    setFiles([]);
    setFileInput("");
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
    if (!studentId) {
      toast.error("Please select a student");
      return;
    }
    if (!dueDate) {
      toast.error("Please select a due date");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          studentId,
          dueDate: dueDate.toISOString(),
          files,
          notifyStudent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create assignment");
      }

      toast.success("Assignment created successfully");
      setOpen(false);
      resetForm();

      // Call the onAssignmentCreated callback if provided
      if (onAssignmentCreated) {
        onAssignmentCreated();
      }

      router.refresh();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create assignment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={className}>{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Create a new assignment for your student
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
            <Label htmlFor="student">
              Student
              {mentorInterests.length > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Matching your interests: {mentorInterests.join(", ")})
                </span>
              )}
            </Label>

            {studentsLoading ? (
              <div className="h-10 px-3 py-2 rounded-md border flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">
                  Loading students...
                </span>
              </div>
            ) : error ? (
              <div className="h-10 px-3 py-2 rounded-md border bg-muted/20 flex items-center text-muted-foreground">
                {error}
              </div>
            ) : specificStudentId ? (
              <div className="h-10 px-3 py-2 rounded-md border bg-muted/20 flex items-center">
                {students.find((s) => s.id === specificStudentId)?.name ||
                  "Selected student"}
              </div>
            ) : (
              <Select
                value={studentId}
                onValueChange={setStudentId}
                disabled={isLoading || students.length === 0}
              >
                <SelectTrigger id="student">
                  <SelectValue
                    placeholder={
                      students.length === 0
                        ? "No students with matching interests found"
                        : "Select a student"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                      {student.interests && student.interests.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({student.interests.join(", ")})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
            <p className="text-xs text-muted-foreground">
              Add links to resources, documentation, or examples
            </p>

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
            <input
              type="checkbox"
              id="notifyStudent"
              checked={notifyStudent}
              onChange={(e) => setNotifyStudent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="notifyStudent" className="text-sm font-normal">
              Notify student about this assignment
            </Label>
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
                Creating...
              </>
            ) : (
              "Create Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
