import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  // Get counts for each model to display on dashboard
  const userCount = await prisma.user.count();
  const studentCount = await prisma.student.count();
  const mentorCount = await prisma.mentor.count();
  const assignmentCount = await prisma.assignment.count();
  const contactUsCount = await prisma.contactUs.count();

  const stats = [
    { name: "Users", count: userCount, href: "/admin/users" },
    { name: "Students", count: studentCount, href: "/admin/students" },
    { name: "Mentors", count: mentorCount, href: "/admin/mentors" },
    { name: "Assignments", count: assignmentCount, href: "/admin/assignments" },
    {
      name: "Contact Requests",
      count: contactUsCount,
      href: "/admin/contactus",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stat.count}
                </dd>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
