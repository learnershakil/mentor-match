import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { CreateAssignmentDialog } from "@/components/assignments/create-assignment-dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  studentName: string;
  studentImage?: string;
  dueDate: string | Date;
  status: "PENDING" | "SUBMITTED" | "COMPLETED" | "LATE";
}

interface AssignmentsCardProps {
  className?: string;
}

export function AssignmentsCard({ className }: AssignmentsCardProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAssignments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/assignments?limit=3");

        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }

        const data = await response.json();

        // Transform the API data to match our component's expected format
        const formattedAssignments = data.assignments.map(
          (assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            studentName: `${assignment.student.user.firstName} ${assignment.student.user.lastName}`,
            studentImage: assignment.student.user.image,
            dueDate: assignment.dueDate,
            status: assignment.status,
          })
        );

        setAssignments(formattedAssignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        toast.error("Failed to load recent assignments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentAssignments();
  }, []);

  const formatDueDate = (dueDate: string | Date) => {
    if (typeof dueDate === "string") {
      try {
        const date = parseISO(dueDate);
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        return format(date, "MMM d, yyyy");
      } catch (e) {
        return dueDate; // Return as is if parsing fails
      }
    }
    if (isToday(dueDate)) return "Today";
    if (isYesterday(dueDate)) return "Yesterday";
    return format(dueDate, "MMM d, yyyy");
  };

  const handleAssignmentCreated = () => {
    // Refresh assignments after creating a new one
    fetchRecentAssignments();
  };

  const fetchRecentAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/assignments?limit=3");

      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const data = await response.json();

      // Transform the API data
      const formattedAssignments = data.assignments.map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        studentName: `${assignment.student.user.firstName} ${assignment.student.user.lastName}`,
        studentImage: assignment.student.user.image,
        dueDate: assignment.dueDate,
        status: assignment.status,
      }));

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load recent assignments");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Assignments</CardTitle>
        <CreateAssignmentDialog onAssignmentCreated={handleAssignmentCreated}>
          <Button variant="ghost" size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Create New</span>
          </Button>
        </CreateAssignmentDialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between space-x-4"
              >
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">No assignments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between space-x-4"
              >
                <div>
                  <p className="font-medium">{assignment.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.studentName} • Due{" "}
                    {formatDueDate(assignment.dueDate)}
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
                  {assignment.status === "SUBMITTED"
                    ? "Needs Review"
                    : assignment.status === "COMPLETED"
                    ? "Graded"
                    : assignment.status === "LATE"
                    ? "Late"
                    : "Pending"}
                </Badge>
              </div>
            ))}
            <div className="text-center">
              <Button variant="link" asChild>
                <Link href="/mentor-dashboard/assignments">
                  View all assignments
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
