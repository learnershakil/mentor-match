"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/admin" },
  { name: "Users", href: "/admin/users" },
  { name: "Students", href: "/admin/students" },
  { name: "Mentors", href: "/admin/mentors" },
  { name: "Weekly Progress", href: "/admin/weekly-progress" },
  { name: "Assignments", href: "/admin/assignments" },
  { name: "Meetings", href: "/admin/meetings" },
  { name: "Events", href: "/admin/events" },
  { name: "Messages", href: "/admin/messages" },
  { name: "Notifications", href: "/admin/notifications" },
  { name: "Contact Us", href: "/admin/contactus" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-white text-xl font-bold">Admin Dashboard</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-gray-800 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
