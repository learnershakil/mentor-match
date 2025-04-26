"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarPlus,
  ClipboardList,
  Loader2,
  MessageSquare,
  Bell,
  Clock,
  BookOpen,
  GraduationCap,
} from "lucide-react";

import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateAssignmentDialog } from "@/components/assignments/create-assignment-dialog";
import { ScheduleSessionButton } from "@/components/sessions/schedule-session-button";
import { SendNotificationDialog } from "@/components/mentor-dashboard/send-notification-dialog";
import { SendMessageDialog } from "@/components/mentor-dashboard/send-message-dialog";
import { toast } from "sonner";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";

interface StudentDetails {
  id: string;
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  interest?: string;
  interests: string[];
  level: string;
  bio?: string;
  assignments: any[];
  sessions: any[];
}

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  // Fetch student details
  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/mentor/students/${studentId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch student details");
        }

        const data = await response.json();
        setStudent(data.student);
      } catch (err) {
        console.error("Error fetching student details:", err);
        setError("Could not load student details. Please try again.");
        toast.error("Failed to load student details");
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  // Render loading state
  if (isLoading) {
    return (
      <MentorDashboardShell>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading student details...</p>
          </div>
        </div>
      </MentorDashboardShell>
    );
  }

  // Render error state
  if (error) {
    return (
      <MentorDashboardShell>
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </MentorDashboardShell>
    );
  }

  // Render if student not found
  if (!student) {
    return (
      <MentorDashboardShell>
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
          <p>Student not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </MentorDashboardShell>
    );
  }

  return (
    <MentorDashboardShell>
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-muted-foreground">
            View and manage this student's information
          </p>
        </div>
      </div>

      {/* Student profile summary */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={student.image || undefined}
                alt={student.name}
              />
              <AvatarFallback className="text-lg">
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <p className="text-muted-foreground">{student.email}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>{student.level}</Badge>
                {student.interest && (
                  <Badge variant="secondary">
                    {student.interest.replace(/([A-Z])/g, " $1").trim()}
                  </Badge>
                )}
                {student.interests &&
                  student.interests.map(
                    (interest, idx) =>
                      interest !== student.interest && (
                        <Badge key={idx} variant="outline">
                          {interest.replace(/([A-Z])/g, " $1").trim()}
                        </Badge>
                      )
                  )}
              </div>

              {student.bio && <p className="text-sm">{student.bio}</p>}
            </div>

            <div className="flex flex-wrap gap-2 md:flex-col">
              <Button
                className="gap-2"
                onClick={() => setIsMessageDialogOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsNotificationDialogOpen(true)}
              >
                <Bell className="h-4 w-4" />
                Notify
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Create Assignment</h3>
              <p className="text-sm text-muted-foreground">
                Assign a new task for this student
              </p>
              <CreateAssignmentDialog specificStudentId={studentId}>
                <Button>Create Assignment</Button>
              </CreateAssignmentDialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <CalendarPlus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Schedule Session</h3>
              <p className="text-sm text-muted-foreground">
                Book a mentoring session with this student
              </p>
              <ScheduleSessionButton
                className="mt-2 w-full"
                specificStudentId={studentId}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Learning Path</h3>
              <p className="text-sm text-muted-foreground">
                View and manage student's learning roadmap
              </p>
              <Button variant="outline" className="mt-2 w-full">
                View Path
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Assignments, Sessions, Progress */}
      <Tabs defaultValue="assignments" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {student.assignments && student.assignments.length > 0 ? (
                <div className="space-y-4">
                  {student.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-start justify-between border-b pb-4"
                    >
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {assignment.description?.substring(0, 100)}
                          {assignment.description?.length > 100 ? "..." : ""}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant={
                              assignment.status === "COMPLETED"
                                ? "outline"
                                : assignment.status === "SUBMITTED"
                                ? "default"
                                : assignment.status === "LATE"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {assignment.status.charAt(0) +
                              assignment.status.slice(1).toLowerCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due:{" "}
                            {format(
                              new Date(assignment.dueDate),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {assignment.status === "SUBMITTED" ? "Grade" : "View"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">
                    No assignments yet
                  </p>
                  <CreateAssignmentDialog specificStudentId={studentId}>
                    <Button>Create First Assignment</Button>
                  </CreateAssignmentDialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {student.sessions && student.sessions.length > 0 ? (
                <div className="space-y-4">
                  {student.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start justify-between border-b pb-4"
                    >
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              session.status === "COMPLETED"
                                ? "outline"
                                : session.status === "CANCELLED"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {session.status.charAt(0) +
                              session.status.slice(1).toLowerCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(
                              new Date(session.startTime),
                              "MMM d, yyyy h:mm a"
                            )}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {session.status === "COMPLETED"
                          ? "View Notes"
                          : "View Details"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">
                    No sessions scheduled
                  </p>
                  <ScheduleSessionButton specificStudentId={studentId}>
                    Schedule First Session
                  </ScheduleSessionButton>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Progress tracking coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Mentor Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Notes feature coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Dialog */}
      <SendNotificationDialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
        studentIds={[studentId]}
        onSuccess={() => toast.success("Notification sent successfully")}
      />

      {/* Message Dialog */}
      <SendMessageDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        studentIds={[studentId]}
        onSuccess={() => toast.success("Message sent successfully")}
      />

      <ChatbotCard />
    </MentorDashboardShell>
  );
}
