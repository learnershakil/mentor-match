import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Student Dashboard | MentorMatch",
  description: "Manage your learning sessions, assignments",
};

interface StudentDashboardLayoutProps {
  children: React.ReactNode;
}

export default async function StudentDashboardLayout({
  children,
}: StudentDashboardLayoutProps) {
  // @ts-ignore
  const session = await getServerSession(NEXT_AUTH_CONFIG);

  // If no session, redirect to login
  if (!session) {
    redirect("/signin");
  }

  // If not a mentor, redirect to regular dashboard
  if (session.user.role === "MENTOR") {
    redirect("/mentor-dashboard");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }
  return <>{children}</>;
}
