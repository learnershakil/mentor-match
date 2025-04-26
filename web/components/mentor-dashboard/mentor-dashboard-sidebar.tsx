"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  Timer,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/mentor-dashboard",
    icon: Home,
  },
  {
    title: "Sessions",
    href: "/mentor-dashboard/sessions",
    icon: Timer,
  },
  {
    title: "Students",
    href: "/mentor-dashboard/students",
    icon: Users,
  },
  {
    title: "Assignments",
    href: "/mentor-dashboard/assignments",
    icon: ClipboardCheck,
  },
  {
    title: "Calendar",
    href: "/mentor-dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Messages",
    href: "/mentor-dashboard/messages",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/mentor-dashboard/settings",
    icon: Settings,
  },
];

export function MentorDashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
      <div className="h-full py-6 pr-6 lg:pr-8">
        <div className="mb-4 px-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Mentor Portal
          </p>
        </div>
        <nav className="flex flex-col gap-2">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-accent text-accent-foreground"
                  : "transparent"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}

          {session && (
            <button
              onClick={handleLogout}
              className="group mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          )}
        </nav>
      </div>
    </aside>
  );
}
