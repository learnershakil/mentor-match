"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { NotificationsButton } from "@/components/dashboard/notifications-button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type ProgressData = {
  totalSessions: number;
  totalSessionsLastMonth: number;
  learningHours: number;
  learningHoursLastMonth: number;
  completedProjects: number;
  completedProjectsLastMonth: number;
  skills: {
    id: string;
    skill: string;
    masteryLevel: number;
  }[];
  goals: {
    id: string;
    goal: string;
    target: string;
    completion: number;
    Due: number;
    due_Type: string;
  }[];
  projects: {
    id: string;
    projectName: string;
    description: string;
    completion: number;
    viewLink?: string;
    feedback?: string;
  }[];
  certificates: {
    id: string;
    certificateName: string;
    issueDate: string;
    viewLink?: string;
    downloadLink?: string;
  }[];
};

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/progress");

        if (!response.ok) {
          // Handle non-200 responses
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            `Error: ${response.status} ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setProgressData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching progress data:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        // Provide fallback data for better UX instead of showing error
        setProgressData({
          totalSessions: 0,
          totalSessionsLastMonth: 0,
          learningHours: 0,
          learningHoursLastMonth: 0,
          completedProjects: 0,
          completedProjectsLastMonth: 0,
          skills: [],
          goals: [],
          projects: [],
          certificates: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  // Helper function to determine skill level badge
  const getSkillLevelBadge = (level: number) => {
    if (level >= 80) return <Badge>Advanced</Badge>;
    if (level >= 50) return <Badge>Intermediate</Badge>;
    return <Badge>Beginner</Badge>;
  };

  // Helper function to determine project status badge
  const getProjectStatusBadge = (completion: number) => {
    if (completion === 100)
      return <Badge className="bg-green-500">Completed</Badge>;
    if (completion > 0)
      return <Badge className="bg-amber-500 text-white">In Progress</Badge>;
    return <Badge variant="outline">Not Started</Badge>;
  };

  if (error) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Your Progress"
          text="Track your learning journey and achievements"
        >
          <NotificationsButton />
        </DashboardHeader>

        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Your Progress"
        text="Track your learning journey and achievements"
      >
        <NotificationsButton />
      </DashboardHeader>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {progressData?.totalSessions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      progressData?.totalSessionsLastMonth &&
                      progressData.totalSessionsLastMonth > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {progressData?.totalSessionsLastMonth &&
                    progressData.totalSessionsLastMonth > 0
                      ? "+"
                      : ""}
                    {progressData?.totalSessionsLastMonth || 0}
                  </span>{" "}
                  from last month
                </p>
                <Progress
                  className="mt-2"
                  value={
                    progressData?.totalSessions
                      ? Math.min(progressData.totalSessions * 5, 100)
                      : 0
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Learning Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {progressData?.learningHours || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      progressData?.learningHoursLastMonth &&
                      progressData.learningHoursLastMonth > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {progressData?.learningHoursLastMonth &&
                    progressData.learningHoursLastMonth > 0
                      ? "+"
                      : ""}
                    {progressData?.learningHoursLastMonth || 0}
                  </span>{" "}
                  from last month
                </p>
                <Progress
                  className="mt-2"
                  value={
                    progressData?.learningHours
                      ? Math.min(progressData.learningHours * 2, 100)
                      : 0
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {progressData?.completedProjects || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      progressData?.completedProjectsLastMonth &&
                      progressData.completedProjectsLastMonth > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {progressData?.completedProjectsLastMonth &&
                    progressData.completedProjectsLastMonth > 0
                      ? "+"
                      : ""}
                    {progressData?.completedProjectsLastMonth || 0}
                  </span>{" "}
                  from last month
                </p>
                <Progress
                  className="mt-2"
                  value={
                    progressData?.completedProjects
                      ? Math.min(progressData.completedProjects * 20, 100)
                      : 0
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="skills">Skills Progress</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills Mastery</CardTitle>
              <CardDescription>
                Track your progress in different skill areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <div className="mb-2 flex items-center justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="mt-1 h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {progressData?.skills && progressData.skills.length > 0 ? (
                    progressData.skills.map((skill) => (
                      <div key={skill.id}>
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium">{skill.skill}</h4>
                          {getSkillLevelBadge(skill.masteryLevel)}
                        </div>
                        <Progress value={skill.masteryLevel} className="h-2" />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {skill.masteryLevel}% complete
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No skills data available.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
              <CardDescription>
                Track your progress towards your learning objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <Skeleton className="h-5 w-48" />
                      <div className="mt-2 flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="mt-2 h-2 w-full" />
                      <Skeleton className="mt-2 h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {progressData?.goals && progressData.goals.length > 0 ? (
                    progressData.goals.map((goal) => (
                      <div key={goal.id} className="rounded-lg border p-4">
                        <h4 className="font-medium">{goal.goal}</h4>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {goal.target} Goal
                          </span>
                          <span>{goal.completion}% complete</span>
                        </div>
                        <Progress
                          value={goal.completion}
                          className="mt-2 h-2"
                        />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Due in {goal.Due} {goal.due_Type.toLowerCase()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No learning goals available.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                Track your project progress and submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="mt-1 h-4 w-full" />
                      <div className="mt-4 flex gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {progressData?.projects &&
                  progressData.projects.length > 0 ? (
                    progressData.projects.map((project) => (
                      <div key={project.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{project.projectName}</h4>
                          {getProjectStatusBadge(project.completion)}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {project.description}
                        </p>

                        {project.completion > 0 && project.completion < 100 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Progress
                              </span>
                              <span>{project.completion}% complete</span>
                            </div>
                            <Progress
                              value={project.completion}
                              className="mt-2 h-2"
                            />
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          {project.viewLink && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={project.viewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Project
                              </a>
                            </Button>
                          )}

                          {project.feedback && (
                            <Button variant="outline" size="sm">
                              View Feedback
                            </Button>
                          )}

                          {project.completion < 100 && (
                            <Button variant="outline" size="sm">
                              {project.completion === 0
                                ? "Start Project"
                                : "Continue Project"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No projects available.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Your Certificates</CardTitle>
              <CardDescription>
                View and download your earned certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="mt-1 h-4 w-32" />
                      <div className="mt-4 flex gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {progressData?.certificates &&
                  progressData.certificates.length > 0 ? (
                    progressData.certificates.map((certificate) => (
                      <div
                        key={certificate.id}
                        className="rounded-lg border p-4"
                      >
                        <h4 className="font-medium">
                          {certificate.certificateName}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Issued on {certificate.issueDate}
                        </p>
                        <div className="mt-4 flex gap-2">
                          {certificate.viewLink && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={certificate.viewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Certificate
                              </a>
                            </Button>
                          )}

                          {certificate.downloadLink && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={certificate.downloadLink} download>
                                Download PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No certificates available.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ChatbotCard />
    </DashboardShell>
  );
}
