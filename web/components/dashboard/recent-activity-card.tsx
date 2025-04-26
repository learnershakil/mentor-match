"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  FileText,
  MessageSquare,
  Video,
  Bell,
  GraduationCap,
  FileCode,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivityCardProps {
  className?: string;
  limit?: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  content?: string;
  time: string;
  isRead: boolean;
  user?: {
    name: string;
    avatar?: string;
    initials: string;
  };
}

export function RecentActivityCard({
  className,
  limit = 5,
}: RecentActivityCardProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch notifications from the API
      const response = await fetch(`/api/notifications?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch activity data");
      }

      const data = await response.json();

      // Map the notifications to the activity format
      const mappedActivities = data.notifications.map((notification: any) => {
        // Generate icon and user data based on notification type
        const { icon, user } = getNotificationMetadata(notification.type);

        return {
          id: notification.id,
          type: notification.type.toLowerCase(),
          title: notification.title,
          content: notification.content,
          time: formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          }),
          isRead: notification.isRead,
          user,
        };
      });

      setActivities(mappedActivities);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to load recent activities");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate icon and user data based on notification type
  const getNotificationMetadata = (type: string) => {
    switch (type) {
      case "SESSION":
        return {
          icon: Video,
          user: {
            name: "Session Manager",
            avatar: "/placeholder.svg?height=32&width=32",
            initials: "SM",
          },
        };
      case "MESSAGE":
        return {
          icon: MessageSquare,
          user: {
            name: "Messaging Service",
            avatar: "/placeholder.svg?height=32&width=32",
            initials: "MS",
          },
        };
      case "ASSIGNMENT":
        return {
          icon: FileCode,
          user: {
            name: "Assignment System",
            avatar: "/placeholder.svg?height=32&width=32",
            initials: "AS",
          },
        };
      case "ROADMAP":
        return {
          icon: GraduationCap,
          user: {
            name: "Learning Path",
            avatar: "/placeholder.svg?height=32&width=32",
            initials: "LP",
          },
        };
      case "SYSTEM":
      default:
        return {
          icon: Bell,
          user: {
            name: "System",
            avatar: "/placeholder.svg?height=32&width=32",
            initials: "SY",
          },
        };
    }
  };

  // Helper function to get activity type badge
  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case "session":
        return (
          <div className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Session
          </div>
        );
      case "message":
        return (
          <div className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
            Message
          </div>
        );
      case "assignment":
        return (
          <div className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
            Assignment
          </div>
        );
      case "roadmap":
        return (
          <div className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-500">
            Learning Path
          </div>
        );
      case "system":
      default:
        return (
          <div className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
            System
          </div>
        );
    }
  };

  const renderActivityList = () => {
    if (isLoading) {
      return Array(3)
        .fill(0)
        .map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="flex items-start gap-4 rounded-lg border p-3"
          >
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ));
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={fetchActivities}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (activities.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No recent activities</p>
        </div>
      );
    }

    return activities.map((activity) => (
      <div
        key={activity.id}
        className={cn(
          "flex items-start gap-4 rounded-lg border p-3",
          !activity.isRead && "bg-muted/50"
        )}
      >
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={activity.user?.avatar}
            alt={activity.user?.name || "User"}
          />
          <AvatarFallback>{activity.user?.initials || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">{activity.title}</p>
          {activity.content && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {activity.content}
            </p>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{activity.time}</span>
            </div>
            {getActivityTypeBadge(activity.type)}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        {activities.length > 0 && !isLoading && !error && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => (window.location.href = "/dashboard/notifications")}
          >
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">{renderActivityList()}</div>
      </CardContent>
    </Card>
  );
}
