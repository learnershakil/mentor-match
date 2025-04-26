"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  File,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
import { MentorDashboardHeader } from "@/components/mentor-dashboard/mentor-dashboard-header";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateAssignmentDialog } from "@/components/assignments/create-assignment-dialog";
import { EditAssignmentDialog } from "@/components/assignments/edit-assignment-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types
interface Student {
  id: string;
  name: string;
  image?: string;
  interests: string[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  submittedAt?: string;
  student: {
    id: string;
    name: string;
    image?: string;
  };
  status: "PENDING" | "SUBMITTED" | "COMPLETED" | "LATE";
  grade?: string;
  feedback?: string;
  files?: string[];
}

export default function MentorAssignmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("to-grade");
  const [searchQuery, setSearchQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(
    null
  );
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch assignments from API
  const fetchAssignments = async (tab?: string) => {
    try {
      setIsLoading(true);
      const activeStatus = tab || activeTab;

      // Determine status filter based on tab
      let statusParam = "";
      if (activeStatus === "to-grade") {
        statusParam = "SUBMITTED";
      } else if (activeStatus === "pending") {
        statusParam = "PENDING";
      } else if (activeStatus === "graded") {
        statusParam = "COMPLETED";
      }

      // Build query string
      const params = new URLSearchParams();
      if (statusParam) params.append("status", statusParam);
      if (studentFilter) params.append("studentId", studentFilter);

      const response = await fetch(`/api/assignments?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const data = await response.json();

      // Transform data to match our component's expected format
      const formattedAssignments: Assignment[] = data.assignments.map(
        (assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          submittedAt: assignment.submittedAt,
          student: {
            id: assignment.student.id,
            name: `${assignment.student.user.firstName} ${assignment.student.user.lastName}`,
            image: assignment.student.user.image,
          },
          status: assignment.status,
          grade: assignment.grade,
          feedback: assignment.feedback,
          files: assignment.files,
        })
      );

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students with matching interests
  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/mentor/students");

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();

      // Transform data with proper error handling
      const formattedStudents: Student[] = data.students.map((student: any) => {
        // Add null checking to prevent undefined access errors
        const firstName = student.user?.firstName || "Unknown";
        const lastName = student.user?.lastName || "";
        return {
          id: student.id,
          name: `${firstName} ${lastName}`,
          image: student.user?.image,
          interests: student.learningInterests || [],
        };
      });

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  // Handle assignment deletion
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/assignments/${assignmentToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }

      toast.success("Assignment deleted successfully");
      fetchAssignments(); // Refresh the list
      setAssignmentToDelete(null);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchAssignments(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Filter assignments based on search query
  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.student.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Effect to load data on mount and when filters change
  useEffect(() => {
    fetchAssignments();
    fetchStudents();
  }, [studentFilter, activeTab]);

  return (
    <MentorDashboardShell>
      <MentorDashboardHeader
        heading="Assignments"
        text="Create and manage assignments for your students"
      >
        <div className="flex items-center gap-2">
          {/* Fix: Use a div instead of Button to avoid nesting buttons */}
          <div>
            <CreateAssignmentDialog
              onAssignmentCreated={() => fetchAssignments()}
            >
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                <span>Create Assignment</span>
              </Button>
            </CreateAssignmentDialog>
          </div>
        </div>
      </MentorDashboardHeader>

      <div className="mt-6">
        <Tabs
          defaultValue={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="to-grade">To Grade</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="graded">Graded</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap gap-2">
              <div className="relative w-full sm:w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading assignments...</span>
              </CardContent>
            </Card>
          )}

          {/* To Grade tab */}
          <TabsContent value="to-grade" className="space-y-4">
            {!isLoading && filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex h-40 flex-col items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No assignments to grade
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    When students submit their assignments, they'll appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="mt-1 h-10 w-10">
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
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Student: {assignment.student.name}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {assignment.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span>Due: {formatDate(assignment.dueDate)}</span>
                            </div>
                            {assignment.submittedAt && (
                              <div className="flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" />
                                <span>
                                  Submitted:{" "}
                                  {formatDate(assignment.submittedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge>Submitted</Badge>
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/mentor-dashboard/assignments/${assignment.id}/grade`}
                                >
                                  Grade Assignment
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setAssignmentToEdit(assignment);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Assignment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setAssignmentToDelete(assignment.id)
                                }
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Assignment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pending tab */}
          <TabsContent value="pending" className="space-y-4">
            {!isLoading && filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex h-40 flex-col items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No pending assignments
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create new assignments for your students.
                  </p>
                  <CreateAssignmentDialog
                    onAssignmentCreated={() => fetchAssignments()}
                    className="mt-4"
                  >
                    <Button size="sm" className="gap-1 mt-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Assignment</span>
                    </Button>
                  </CreateAssignmentDialog>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="mt-1 h-10 w-10">
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
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Student: {assignment.student.name}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {assignment.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span>Due: {formatDate(assignment.dueDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">Pending</Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAssignmentToEdit(assignment);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Assignment
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this
                                  assignment? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    setAssignmentToDelete(assignment.id);
                                    handleDeleteAssignment();
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeleting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Graded tab */}
          <TabsContent value="graded" className="space-y-4">
            {!isLoading && filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex h-40 flex-col items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No graded assignments
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Assignments you've graded will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="mt-1 h-10 w-10">
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
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Student: {assignment.student.name}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {assignment.description}
                          </p>
                          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span>Due: {formatDate(assignment.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" />
                              <span>Grade: {assignment.grade}</span>
                            </div>
                            {assignment.feedback && (
                              <p className="mt-1 text-xs line-clamp-2">
                                Feedback: {assignment.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">Graded</Badge>
                        <div className="flex gap-2">
                          <Link
                            href={`/mentor-dashboard/assignments/${assignment.id}`}
                            passHref
                          >
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete assignment confirmation dialog */}
      <AlertDialog
        open={!!assignmentToDelete}
        onOpenChange={(open) => !open && setAssignmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit assignment dialog */}
      {assignmentToEdit && (
        <EditAssignmentDialog
          assignment={assignmentToEdit}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onAssignmentUpdated={() => {
            fetchAssignments();
            setAssignmentToEdit(null);
          }}
        />
      )}

      <ChatbotCard />
    </MentorDashboardShell>
  );
}
