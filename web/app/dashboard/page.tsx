import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NotificationsButton } from "@/components/dashboard/notifications-button";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { UpcomingSessionsCard } from "@/components/dashboard/upcoming-sessions-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { MentorMapCard } from "@/components/dashboard/mentor-map-card";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";

export default async function DashboardPage() {
  // Check for session on the server side
  const session = await getServerSession(authOptions);

  // If no session exists, redirect to the signin page
  if (!session) {
    redirect("/signin");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome to Mentor Match - your personal learning platform"
      >
        <NotificationsButton />
      </DashboardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WelcomeCard className="col-span-full" />
        <ProgressCard className="lg:col-span-2" />
        <UpcomingSessionsCard className="md:col-span-2 lg:col-span-1" />
        <RecentActivityCard className="lg:col-span-2" />
        <MentorMapCard className="md:col-span-2 lg:col-span-1" />
      </div>
      <ChatbotCard />
    </DashboardShell>
  );
}
