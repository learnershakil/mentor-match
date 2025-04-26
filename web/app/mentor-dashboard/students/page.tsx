"use client";

import { useEffect, useState } from "react";
import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
import { MentorDashboardHeader } from "@/components/mentor-dashboard/mentor-dashboard-header";
import { NotificationsButton } from "@/components/dashboard/notifications-button";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  Bell,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { SendNotificationDialog } from "@/components/mentor-dashboard/send-notification-dialog";
import { SendMessageDialog } from "@/components/mentor-dashboard/send-message-dialog";

interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  interest?: string;
  interests?: string[];
  level?: string;
  hasAssignments?: boolean;
}

export default function MentorStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [activeFilter]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      // Build query parameters
      const params = new URLSearchParams();
      if (activeFilter) {
        params.append("interest", activeFilter);
      }

      const response = await fetch(`/api/mentor/students?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students || []);
      setTotalStudents(data.totalStudents || 0);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students with matching interests");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students based on search text
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (student.email &&
        student.email.toLowerCase().includes(searchText.toLowerCase())) ||
      (student.interest &&
        student.interest.toLowerCase().includes(searchText.toLowerCase()))
  );

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prevSelected) =>
      prevSelected.includes(studentId)
        ? prevSelected.filter((id) => id !== studentId)
        : [...prevSelected, studentId]
    );
  };

  // Select all students
  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((student) => student.id));
    }
  };

  // Handle send notification
  const handleSendNotification = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    setIsNotificationDialogOpen(true);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    setIsMessageDialogOpen(true);
  };

  // Get available interest filters from students
  const getAvailableInterests = () => {
    const interests = new Set<string>();
    students.forEach((student) => {
      if (student.interest) {
        interests.add(student.interest);
      }
      if (student.interests && Array.isArray(student.interests)) {
        student.interests.forEach((interest) => interests.add(interest));
      }
    });
    return Array.from(interests);
  };

  return (
    <MentorDashboardShell>
      <MentorDashboardHeader
        heading="Students"
        text="Manage and track your students' progress with matching interests"
      >
        <NotificationsButton />
      </MentorDashboardHeader>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Your Students with Matching Interests</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading students..."
                  : `You currently have ${totalStudents} students with matching interests`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-[240px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendNotification}
              disabled={selectedStudents.length === 0 || isLoading}
              className="gap-1"
            >
              <Bell className="h-4 w-4" />
              Send Notification
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendMessage}
              disabled={selectedStudents.length === 0 || isLoading}
              className="gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              Send Message
            </Button>

            {/* Interest filters */}
            <div className="ml-auto flex flex-wrap gap-1">
              {!isLoading &&
                getAvailableInterests().map((interest) => (
                  <Badge
                    key={interest}
                    variant={activeFilter === interest ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setActiveFilter(
                        activeFilter === interest ? null : interest
                      )
                    }
                  >
                    {interest.replace(/([A-Z])/g, " $1").trim()}
                    {activeFilter === interest && (
                      <CheckCircle className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
            </div>
          </div>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading students...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground mb-2">
                  {searchText
                    ? "No students matching your search"
                    : "No students found with matching interests"}
                </p>
                {searchText && (
                  <Button variant="outline" onClick={() => setSearchText("")}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedStudents.length === filteredStudents.length &&
                          filteredStudents.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[250px]">Student</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() =>
                            toggleStudentSelection(student.id)
                          }
                          aria-label={`Select ${student.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={student.image || undefined}
                              alt={student.name}
                            />
                            <AvatarFallback>
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.interest && (
                            <Badge variant="secondary" className="text-xs">
                              {student.interest
                                .replace(/([A-Z])/g, " $1")
                                .trim()}
                            </Badge>
                          )}
                          {student.interests &&
                            student.interests.length > 0 &&
                            student.interests
                              .filter((i) => i !== student.interest)
                              .map((interest, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {interest.replace(/([A-Z])/g, " $1").trim()}
                                </Badge>
                              ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.level && (
                          <Badge
                            variant={
                              student.level === "BEGINNER"
                                ? "outline"
                                : student.level === "INTERMEDIATE"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {student.level}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudents([student.id]);
                              setIsNotificationDialogOpen(true);
                            }}
                            className="gap-1"
                          >
                            <Bell className="h-3.5 w-3.5" />
                            <span className="sr-only md:not-sr-only md:inline">
                              Notify
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudents([student.id]);
                              setIsMessageDialogOpen(true);
                            }}
                            className="gap-1"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="sr-only md:not-sr-only md:inline">
                              Message
                            </span>
                          </Button>
                          <Button variant="default" size="sm" asChild>
                            <a
                              href={`/mentor-dashboard/students/${student.id}`}
                            >
                              View
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send Notification Dialog */}
      <SendNotificationDialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
        studentIds={selectedStudents}
        onSuccess={() => {
          setSelectedStudents([]);
          toast.success("Notification sent successfully");
        }}
      />

      {/* Send Message Dialog */}
      <SendMessageDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        studentIds={selectedStudents}
        onSuccess={() => {
          setSelectedStudents([]);
          toast.success("Message sent successfully");
        }}
      />

      <ChatbotCard />
    </MentorDashboardShell>
  );
}
