"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { NotificationsButton } from "@/components/dashboard/notifications-button";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
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

export default function AssignmentsPage() {
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>(
    []
  );
  const [completedAssignments, setCompletedAssignments] = useState<
    Assignment[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/assignments");

      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const data = await response.json();

      // Transform the data to match our component's expected format
      const assignments = data.assignments.map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        submittedAt: assignment.submittedAt,
        mentor: {
          name: `${assignment.mentor.user.firstName} ${assignment.mentor.user.lastName}`,
          image: assignment.mentor.user.image || undefined,
        },
        status: assignment.status,
        grade: assignment.grade,
        feedback: assignment.feedback,
        files: assignment.files || [],
      }));

      // Split assignments into pending and completed
      const pending = assignments.filter(
        (a) =>
          a.status === "PENDING" ||
          a.status === "LATE" ||
          a.status === "SUBMITTED"
      );
      const completed = assignments.filter((a) => a.status === "COMPLETED");

      setPendingAssignments(pending);
      setCompletedAssignments(completed);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError("Failed to load assignments. Please try again.");
      toast.error("Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Assignments"
        text="View and submit your learning assignments"
      >
        <NotificationsButton />
      </DashboardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending{" "}
            {pendingAssignments.length > 0 && `(${pendingAssignments.length})`}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed{" "}
            {completedAssignments.length > 0 &&
              `(${completedAssignments.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-0 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6 min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <p>Loading assignments...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[200px] gap-4">
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchAssignments}>Try Again</Button>
              </CardContent>
            </Card>
          ) : pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[200px]">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No pending assignments</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have any assignments to complete right now
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onRefresh={fetchAssignments}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6 min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <p>Loading assignments...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[200px] gap-4">
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchAssignments}>Try Again</Button>
              </CardContent>
            </Card>
          ) : completedAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[200px]">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No completed assignments</h3>
                <p className="text-sm text-muted-foreground">
                  You haven't completed any assignments yet
                </p>
              </CardContent>
            </Card>
          ) : (
            completedAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onRefresh={fetchAssignments}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <ChatbotCard />
    </DashboardShell>
  );
}
