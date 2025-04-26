import type React from "react";
import { MentorDashboardSidebar } from "@/components/mentor-dashboard/mentor-dashboard-sidebar";

interface MentorDashboardShellProps {
  children: React.ReactNode;
}

export function MentorDashboardShell({ children }: MentorDashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <MentorDashboardSidebar />
        <main className="flex w-full flex-col overflow-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
