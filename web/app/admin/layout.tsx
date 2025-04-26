import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Sidebar from "./components/sidebar";
import Header from "./components/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // If no session, redirect to login
  if (!session) {
    redirect("/signin");
  }

  // If not a mentor, redirect to regular dashboard
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session.user.role === "MENTOR") {
    redirect("/mentor-dashboard");
  }

  if (session.user.role === "STUDENT") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
