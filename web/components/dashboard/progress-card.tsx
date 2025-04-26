"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProgressCardProps {
  className?: string;
}

interface Skill {
  name: string;
  level: string;
  progress: number;
}

interface Goal {
  title: string;
  progress: number;
  dueIn: string;
  type: string;
}

interface Stats {
  completedSessions: number;
  learningHours: number;
  completedProjects: number;
  sessionsLastMonth?: number;
  hoursLastMonth?: number;
  projectsLastMonth?: number;
}

interface WeeklyProgress {
  id: string;
  goals: number;
  sessions: number;
  sessionsExpected: number;
  projects: number;
  projectsExpected: number;
  hoursSpent: number;
  hoursSpentExpected: number;
  skills: number;
  skillsExpected: number;
  subTopics: {
    id: string;
    topic: string;
    progress: number;
  }[];
}

interface ProgressData {
  skills: Skill[];
  currentGoal: Goal | null;
  stats: Stats;
  weeklyProgress?: WeeklyProgress;
}

interface ApiWeeklyProgressResponse {
  user: {
    firstName: string;
    lastName: string;
    intrest: string;
    role: string;
  };
  weeklyProgress: {
    id: string;
    userId: string;
    goals: number;
    Sessions: number;
    SessionsE: number;
    projects: number;
    projectsE: number;
    HoursSpent: number;
    HoursSpentE: number;
    skills: number;
    skillsE: number;
    subTopics: {
      id: string;
      weeklyProgressId: string;
      topic: string;
      progress: number;
    }[];
  }[];
}

export function ProgressCard({ className }: ProgressCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from the weekly progress API endpoint
      const response = await fetch("/api/weeklyProgress?limit=1");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch progress data");
      }

      const data: ApiWeeklyProgressResponse = await response.json();

      // Transform API data to match our component needs
      if (data.weeklyProgress && data.weeklyProgress.length > 0) {
        const latestProgress = data.weeklyProgress[0];

        // Map skills from subtopics
        const skills: Skill[] = latestProgress.subTopics.map((subTopic) => {
          // Determine skill level based on progress
          let level = "Beginner";
          if (subTopic.progress >= 80) level = "Advanced";
          else if (subTopic.progress >= 50) level = "Intermediate";

          return {
            name: subTopic.topic,
            level,
            progress: subTopic.progress,
          };
        });

        // Create a goal from the overall goals progress
        const currentGoal =
          latestProgress.goals > 0
            ? {
                title: `Complete ${data.user.intrest} learning goals`,
                progress: latestProgress.goals,
                dueIn: "this week",
                type: "weekly",
              }
            : null;

        // Create stats from sessions, hours, and projects
        const stats: Stats = {
          completedSessions: latestProgress.Sessions,
          learningHours: latestProgress.HoursSpent,
          completedProjects: latestProgress.projects,
          // Calculate difference from expected numbers (as a placeholder for "last month")
          sessionsLastMonth: Math.round(
            latestProgress.SessionsE - latestProgress.Sessions
          ),
          hoursLastMonth: Math.round(
            latestProgress.HoursSpentE - latestProgress.HoursSpent
          ),
          projectsLastMonth: Math.round(
            latestProgress.projectsE - latestProgress.projects
          ),
        };

        // Format weekly progress in a more readable way
        const weeklyProgress: WeeklyProgress = {
          id: latestProgress.id,
          goals: latestProgress.goals,
          sessions: latestProgress.Sessions,
          sessionsExpected: latestProgress.SessionsE,
          projects: latestProgress.projects,
          projectsExpected: latestProgress.projectsE,
          hoursSpent: latestProgress.HoursSpent,
          hoursSpentExpected: latestProgress.HoursSpentE,
          skills: latestProgress.skills,
          skillsExpected: latestProgress.skillsE,
          subTopics: latestProgress.subTopics,
        };

        setProgressData({
          skills,
          currentGoal,
          stats,
          weeklyProgress,
        });
      } else {
        // If no weekly progress data exists yet
        setProgressData({
          skills: [],
          currentGoal: null,
          stats: {
            completedSessions: 0,
            learningHours: 0,
            completedProjects: 0,
          },
        });

        toast.info(
          "No progress data found. Start tracking your learning journey!"
        );
      }
    } catch (err) {
      console.error("Error fetching progress data:", err);
      setError("Failed to load progress data");

      // Provide fallback data if in development mode
      if (process.env.NODE_ENV === "development") {
        const fallbackData: ProgressData = {
          skills: [
            { name: "HTML & CSS", level: "Advanced", progress: 90 },
            { name: "JavaScript", level: "Intermediate", progress: 75 },
            { name: "React", level: "Intermediate", progress: 65 },
          ],
          currentGoal: {
            title: "Complete React Router Module",
            progress: 65,
            dueIn: "3 days",
            type: "weekly",
          },
          stats: {
            completedSessions: 12,
            learningHours: 24.5,
            completedProjects: 3,
          },
        };
        setProgressData(fallbackData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAllProgress = () => {
    router.push("/dashboard/progress");
  };

  const handleRetry = () => {
    toast.info("Refreshing progress data...");
    fetchProgressData();
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Progress</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleRetry}
            title="Refresh progress data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={handleViewAllProgress}
          >
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : progressData ? (
          <div className="space-y-6">
            {/* Weekly Progress Overview */}
            {progressData.weeklyProgress && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Weekly Overview</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-md border p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">
                        Goals
                      </span>
                      <span className="text-xs font-medium">
                        {progressData.weeklyProgress.goals}%
                      </span>
                    </div>
                    <Progress
                      value={progressData.weeklyProgress.goals}
                      className="h-2"
                    />
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">
                        Skills
                      </span>
                      <span className="text-xs font-medium">
                        {progressData.weeklyProgress.skills}%
                      </span>
                    </div>
                    <Progress
                      value={progressData.weeklyProgress.skills}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Top skills */}
            <div>
              <h3 className="font-medium mb-4">Top Skills</h3>
              <div className="space-y-4">
                {progressData.skills.length > 0 ? (
                  progressData.skills.slice(0, 3).map((skill, index) => (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-medium">{skill.name}</h4>
                        <Badge>{skill.level}</Badge>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {skill.progress}% complete
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No skills tracked yet
                  </p>
                )}
              </div>
            </div>

            {/* Current goal */}
            <div>
              <h3 className="font-medium mb-2">Current Goal</h3>
              {progressData.currentGoal ? (
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium">
                    {progressData.currentGoal.title}
                  </h4>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-xs text-muted-foreground capitalize">
                      {progressData.currentGoal.type} Goal
                    </span>
                    <span className="text-xs">
                      {progressData.currentGoal.progress}% complete
                    </span>
                  </div>
                  <Progress
                    value={progressData.currentGoal.progress}
                    className="mt-2 h-2"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Due in {progressData.currentGoal.dueIn}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No active goal
                  </p>
                  <Button
                    variant="link"
                    className="mt-2 text-xs h-auto p-0"
                    onClick={handleViewAllProgress}
                  >
                    Set a new goal
                  </Button>
                </div>
              )}
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border p-2 text-center">
                <p className="font-medium">
                  {progressData.stats.completedSessions}
                </p>
                <p className="text-xs text-muted-foreground">Sessions</p>
                {progressData.weeklyProgress && (
                  <p
                    className={`text-xs ${
                      progressData.stats.completedSessions >=
                      progressData.weeklyProgress.sessionsExpected
                        ? "text-green-500"
                        : "text-amber-500"
                    }`}
                  >
                    {progressData.stats.completedSessions >=
                    progressData.weeklyProgress.sessionsExpected
                      ? "Completed"
                      : `${
                          progressData.weeklyProgress.sessionsExpected -
                          progressData.stats.completedSessions
                        } remaining`}
                  </p>
                )}
              </div>
              <div className="rounded-md border p-2 text-center">
                <p className="font-medium">
                  {progressData.stats.learningHours}
                </p>
                <p className="text-xs text-muted-foreground">Hours</p>
                {progressData.weeklyProgress && (
                  <p
                    className={`text-xs ${
                      progressData.stats.learningHours >=
                      progressData.weeklyProgress.hoursSpentExpected
                        ? "text-green-500"
                        : "text-amber-500"
                    }`}
                  >
                    {progressData.stats.learningHours >=
                    progressData.weeklyProgress.hoursSpentExpected
                      ? "Completed"
                      : `${
                          progressData.weeklyProgress.hoursSpentExpected -
                          progressData.stats.learningHours
                        } remaining`}
                  </p>
                )}
              </div>
              <div className="rounded-md border p-2 text-center">
                <p className="font-medium">
                  {progressData.stats.completedProjects}
                </p>
                <p className="text-xs text-muted-foreground">Projects</p>
                {progressData.weeklyProgress && (
                  <p
                    className={`text-xs ${
                      progressData.stats.completedProjects >=
                      progressData.weeklyProgress.projectsExpected
                        ? "text-green-500"
                        : "text-amber-500"
                    }`}
                  >
                    {progressData.stats.completedProjects >=
                    progressData.weeklyProgress.projectsExpected
                      ? "Completed"
                      : `${
                          progressData.weeklyProgress.projectsExpected -
                          progressData.stats.completedProjects
                        } remaining`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
