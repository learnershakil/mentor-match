import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface WelcomeCardProps {
  className?: string;
}

export async function WelcomeCard({ className }: WelcomeCardProps) {
  // Fetch the user's session
  const session = await getServerSession(authOptions);

  // Get user's name with fallback
  const userName = session?.user
    ? // @ts-ignore
      `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() ||
      session.user.email?.split("@")[0] ||
      "there"
    : "there";

  // Fetch weekly progress data
  let sessions = 0;
  let goalPercentage = 0;

  try {
    // Get user ID from session for direct prisma query instead of API call
    // @ts-ignore
    const userId = session?.user?.id;

    if (userId) {
      // Import prisma directly
      const { prisma } = await import("@/lib/prisma");

      // Fetch data directly from the database using prisma
      const weeklyProgressData = await prisma.weeklyProgress.findMany({
        where: {
          userId: userId,
        },
        include: {
          subTopics: true,
        },
        orderBy: {
          id: "desc",
        },
        take: 1, // Just get the latest record
      });

      // Extract the data if available
      if (weeklyProgressData.length > 0) {
        sessions = weeklyProgressData[0].Sessions || 0;
        goalPercentage = weeklyProgressData[0].goals || 0;
      }
    }
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
  }

  console.log(
    `Weekly progress: ${sessions} sessions, ${goalPercentage}% of goal`
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-primary pb-6 pt-6 text-primary-foreground">
        <CardTitle className="text-2xl">Welcome, {userName}!</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 pt-4">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            You've completed {sessions}{" "}
            {sessions === 1 ? "session" : "sessions"} this week. Keep up the
            good work!
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(100, Math.max(0, goalPercentage))}%`,
              }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {goalPercentage}% of your weekly goal completed
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
