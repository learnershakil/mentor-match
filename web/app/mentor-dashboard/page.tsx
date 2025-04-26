"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Timer,
  ClipboardCheck,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
import { MentorDashboardHeader } from "@/components/mentor-dashboard/mentor-dashboard-header";
import { MentorStatsCard } from "@/components/mentor-dashboard/mentor-stats-card";
import { MentorScheduleCard } from "@/components/mentor-dashboard/mentor-schedule-card";
import { StudentListCard } from "@/components/mentor-dashboard/student-list-card";
import { AssignmentsCard } from "@/components/mentor-dashboard/assignments-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationsButton } from "@/components/dashboard/notifications-button";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MentorDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/mentor/dashboard");

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data);

        // Store mentor name in localStorage for access from http://localhost:5173
        if (data?.mentor?.name) {
          localStorage.setItem("displayName", data.mentor.name);
          console.log(
            `Set displayName "${data.mentor.name}" in localStorage - this will be accessible when visiting http://localhost:5173`
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Could not load your dashboard. Please try again later.");
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <MentorDashboardShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold mb-4">Error Loading Dashboard</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </MentorDashboardShell>
    );
  }

  return (
    <MentorDashboardShell>
      <MentorDashboardHeader
        heading={`Welcome, ${
          dashboardData?.mentor?.name?.split(" ")[0] || "Mentor"
        }`}
        text="Manage your mentoring activities and students"
      >
        <NotificationsButton />
      </MentorDashboardHeader>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-7 w-1/2 mb-2" />
                <Skeleton className="h-10 w-1/3" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <MentorStatsCard
              title="Total Students"
              value={String(dashboardData?.stats?.totalStudents || "0")}
              icon={Users}
              trend={{ value: "3", positive: true }}
            />
            <MentorStatsCard
              title="Sessions Conducted"
              value={String(dashboardData?.stats?.totalSessions || "0")}
              icon={Timer}
              trend={{ value: "5", positive: true }}
            />
            <MentorStatsCard
              title="Assignments Created"
              value={String(dashboardData?.stats?.totalAssignments || "0")}
              icon={ClipboardCheck}
              trend={{ value: "2", positive: true }}
            />
            <MentorStatsCard
              title="Rating"
              value={String(dashboardData?.stats?.rating?.toFixed(1) || "0.0")}
              icon={Star}
              description={`Based on ${
                dashboardData?.stats?.reviewCount || 0
              } reviews`}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-1/3 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-1/3 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <MentorScheduleCard
              sessions={dashboardData?.upcomingSessions || []}
            />

            <AssignmentsCard
              // @ts-ignore
              assignments={dashboardData?.recentAssignments || []}
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-1/3 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-1/3 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <StudentListCard students={dashboardData?.students || []} />
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentMessages?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentMessages.map((message: any) => (
                      <div key={message.id} className="flex items-start gap-4">
                        <MessageSquare className="mt-1 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{message.user.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {message.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="text-center">
                      <Button variant="link" asChild>
                        <a href="/mentor-dashboard/messages">
                          View all messages
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No recent messages
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ChatbotCard />
    </MentorDashboardShell>
  );
}
