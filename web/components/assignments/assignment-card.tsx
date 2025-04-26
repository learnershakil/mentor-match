"use client";

import { useState } from "react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import {
  Loader2,
  FileText,
  Upload,
  CheckCircle,
  X,
  Calendar,
  Plus,
  Link as LinkIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  submittedAt?: string;
  mentor: {
    name: string;
    image?: string;
  };
  status: string;
  grade?: string;
  feedback?: string;
  files?: string[];
}

interface AssignmentCardProps {
  assignment: Assignment;
  onRefresh: () => void;
}

export function AssignmentCard({ assignment, onRefresh }: AssignmentCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [comments, setComments] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const isPastDue = isPast(new Date(assignment.dueDate));
  const formattedDueDate = format(new Date(assignment.dueDate), "MMM d, yyyy");

  const getStatusBadge = () => {
    switch (assignment.status) {
      case "PENDING":
        return isPastDue ? (
          <Badge variant="destructive">Late</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        );
      case "SUBMITTED":
        return <Badge variant="secondary">Submitted</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "LATE":
        return <Badge variant="destructive">Late</Badge>;
      default:
        return <Badge variant="outline">{assignment.status}</Badge>;
    }
  };

  const handleAddUrl = () => {
    if (currentUrl.trim()) {
      // Basic URL validation
      if (isValidUrl(currentUrl)) {
        setFileUrls([...fileUrls, currentUrl.trim()]);
        setCurrentUrl("");
      } else {
        toast.error("Please enter a valid URL");
      }
    }
  };

  const handleRemoveUrl = (index: number) => {
    setFileUrls(fileUrls.filter((_, i) => i !== index));
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setUploadProgress(30);

      // No need to upload files, just use the URLs directly
      setUploadProgress(70);

      // Submit the assignment with the URLs
      const response = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileUrls,
          comments,
        }),
      });

      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit assignment");
      }

      toast.success("Assignment submitted successfully");
      setIsSubmitDialogOpen(false);
      onRefresh(); // Refresh the assignments list
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit assignment"
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription className="mt-1">
              Assigned by {assignment.mentor.name}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-start mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={assignment.mentor.image}
              alt={assignment.mentor.name}
            />
            <AvatarFallback>
              {assignment.mentor.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm">{assignment.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Due: {formattedDueDate}
            {isPastDue &&
              !["COMPLETED", "SUBMITTED"].includes(assignment.status) && (
                <span className="text-destructive ml-2">
                  (Overdue by{" "}
                  {formatDistanceToNow(new Date(assignment.dueDate))})
                </span>
              )}
          </span>
        </div>

        {assignment.files && assignment.files.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Attached Files:</p>
            <div className="space-y-2">
              {assignment.files.map((file, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {file.split("/").pop()}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {assignment.status === "COMPLETED" && (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-medium">Grade:</p>
              <p className="text-sm">{assignment.grade || "Not graded yet"}</p>
            </div>
            {assignment.feedback && (
              <div>
                <p className="text-sm font-medium">Feedback:</p>
                <p className="text-sm">{assignment.feedback}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {["PENDING", "LATE"].includes(assignment.status) ? (
          <Dialog
            open={isSubmitDialogOpen}
            onOpenChange={setIsSubmitDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full">Submit Assignment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Assignment</DialogTitle>
                <DialogDescription>
                  Submit your work for "{assignment.title}"
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid w-full items-center gap-1.5">
                  <label htmlFor="fileUrl" className="text-sm font-medium">
                    Add File URLs
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="fileUrl"
                      type="url"
                      value={currentUrl}
                      onChange={(e) => setCurrentUrl(e.target.value)}
                      placeholder="https://example.com/yourfile.pdf"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddUrl}
                      disabled={isSubmitting || !currentUrl.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add links to your assignment files (GitHub, Google Drive,
                    Dropbox, etc.)
                  </p>

                  {fileUrls.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm font-medium">Added URLs:</p>
                      {fileUrls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{url}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUrl(index)}
                            disabled={isSubmitting}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <label htmlFor="comments" className="text-sm font-medium">
                    Comments (Optional)
                  </label>
                  <Textarea
                    id="comments"
                    placeholder="Add any comments or notes for your mentor"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {isSubmitting && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-center text-muted-foreground">
                      {uploadProgress < 100
                        ? "Processing your submission..."
                        : "Finalizing submission..."}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsSubmitDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || fileUrls.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Assignment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : assignment.status === "SUBMITTED" ? (
          <Button variant="outline" disabled>
            <CheckCircle className="mr-2 h-4 w-4" />
            Submitted - Awaiting Review
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <CheckCircle className="mr-2 h-4 w-4" />
            Completed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
