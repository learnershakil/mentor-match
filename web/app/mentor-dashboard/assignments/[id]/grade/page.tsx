"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2, X } from "lucide-react";

import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { Checkbox } from "@/components/ui/checkbox";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  submittedAt: string;
  student: {
    id: string;
    name: string;
    image?: string;
  };
  mentor: {
    id: string;
    name: string;
    image?: string;
  };
  status: string;
  grade?: string;
  feedback?: string;
  files?: string[];
  Comments?: string;
}

export default function GradeAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [notifyStudent, setNotifyStudent] = useState(true);

  // Fetch assignment details
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/assignments/${assignmentId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch assignment");
        }

        const data = await response.json();

        // Format the data for our component
        const formattedAssignment: Assignment = {
          id: data.id,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          submittedAt: data.submittedAt,
          student: {
            id: data.student.id,
            name: `${data.student.user.firstName} ${data.student.user.lastName}`,
            image: data.student.user.image,
          },
          mentor: {
            id: data.mentor.id,
            name: `${data.mentor.user.firstName} ${data.mentor.user.lastName}`,
            image: data.mentor.user.image,
          },
          status: data.status,
          grade: data.grade,
          feedback: data.feedback,
          files: data.files,
          Comments: data.Comments,
        };

        setAssignment(formattedAssignment);

        // Pre-fill form fields if assignment is already graded
        if (data.grade) setGrade(data.grade);
        if (data.feedback) setFeedback(data.feedback);
      } catch (error) {
        console.error("Error fetching assignment:", error);
        setError("Failed to load assignment");
        toast.error("Could not load assignment details");
      } finally {
        setIsLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const handleSubmitGrade = async () => {
    if (!grade.trim()) {
      toast.error("Please enter a grade");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/assignments/${assignmentId}/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grade,
          feedback,
          notifyStudent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit grade");
      }

      toast.success("Assignment graded successfully");
      router.push("/mentor-dashboard/assignments");
    } catch (error) {
      console.error("Error submitting grade:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit grade"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <MentorDashboardShell>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Grade Assignment
            </h1>
            <p className="text-muted-foreground">
              Review and grade the student's submission
            </p>
          </div>
        </div>

        <Card className="mt-6">
          <CardContent className="flex items-center justify-center p-6 min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Loading assignment details...</p>
          </CardContent>
        </Card>
      </MentorDashboardShell>
    );
  }

  // Render error state
  if (error || !assignment) {
    return (
      <MentorDashboardShell>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Grade Assignment
            </h1>
            <p className="text-muted-foreground">
              Review and grade the student's submission
            </p>
          </div>
        </div>

        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px] gap-4">
            <X className="h-8 w-8 text-destructive" />
            <p className="text-destructive">
              {error || "Assignment not found"}
            </p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </MentorDashboardShell>
    );
  }

  return (
    <MentorDashboardShell>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Grade Assignment
          </h1>
          <p className="text-muted-foreground">
            Review and grade the student's submission
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Assignment details section */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{assignment.title}</h2>
                <p className="text-muted-foreground">
                  {assignment.description}
                </p>
              </div>
              <Badge
                variant={
                  assignment.status === "SUBMITTED"
                    ? "default"
                    : assignment.status === "COMPLETED"
                    ? "outline"
                    : assignment.status === "LATE"
                    ? "destructive"
                    : "secondary"
                }
              >
                {assignment.status}
              </Badge>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={assignment.student.image}
                  alt={assignment.student.name}
                />
                <AvatarFallback>
                  {assignment.student.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{assignment.student.name}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Due: {formatDate(assignment.dueDate)}</span>
                  {assignment.submittedAt && (
                    <span>Submitted: {formatDate(assignment.submittedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student submission section */}
        <Card>
          <CardHeader>
            <CardTitle>Student Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {assignment.files && assignment.files.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Submitted Files</h3>
                  <ul className="space-y-2">
                    {assignment.files.map((file, index) => (
                      <li key={index} className="rounded-md border p-2">
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          <span>{file}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Open in new tab)
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {assignment.Comments && (
                  <div>
                    <h3 className="font-medium mb-2">Student Comments</h3>
                    <div className="rounded-md border p-3 bg-muted/30">
                      <p>{assignment.Comments}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  No files have been submitted yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grading section */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  placeholder="Enter a grade (e.g., A, B+, 95%)"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide detailed feedback for the student"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                  disabled={isSubmitting}
                />
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
                  Notify student about this grade
                </Label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitGrade} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit Grade
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChatbotCard />
    </MentorDashboardShell>
  );
}
