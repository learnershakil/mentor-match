import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mentor Dashboard | MentorMatch",
  description: "Manage your mentoring sessions, assignments, and students",
};

interface MentorDashboardLayoutProps {
  children: React.ReactNode;
}

export default async function MentorDashboardLayout({
  children,
}: MentorDashboardLayoutProps) {
  // @ts-ignore
  const session = await getServerSession(NEXT_AUTH_CONFIG);

  // If no session, redirect to login
  if (!session) {
    redirect("/signin");
  }

  // Check for admin role first
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }
  // If not a mentor, redirect to regular dashboard
  else if (session.user.role !== "MENTOR") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
