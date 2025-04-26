"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define the types based on the schema
const NOTIFICATION_TYPES = [
  "ASSIGNMENT",
  "MESSAGE",
  "SESSION",
  "ROADMAP",
  "SYSTEM",
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/admin/notifications");

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      // Remove from state
      setNotifications(notifications.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
      alert(err.message);
    }
  };

  const handleMarkAsRead = async (id, isCurrentlyRead) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !isCurrentlyRead }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification");
      }

      // Update state
      setNotifications(
        notifications.map((item) =>
          item.id === id ? { ...item, isRead: !isCurrentlyRead } : item
        )
      );
    } catch (err) {
      console.error("Error updating notification:", err);
      alert(err.message);
    }
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case "ASSIGNMENT":
        return "bg-purple-100 text-purple-800";
      case "MESSAGE":
        return "bg-blue-100 text-blue-800";
      case "SESSION":
        return "bg-green-100 text-green-800";
      case "ROADMAP":
        return "bg-yellow-100 text-yellow-800";
      case "SYSTEM":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter and search notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Handle type filter
    if (filter !== "ALL" && notification.type !== filter) {
      return false;
    }

    // Handle search
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(term) ||
        notification.content.toLowerCase().includes(term) ||
        notification.user?.firstName?.toLowerCase().includes(term) ||
        notification.user?.lastName?.toLowerCase().includes(term) ||
        notification.user?.email?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <Link
            href="/admin/notifications/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Create Notification
          </Link>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Link
          href="/admin/notifications/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create Notification
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-md text-red-800">
          <h3 className="text-lg font-semibold mb-2">
            Error loading notifications
          </h3>
          <p>{error}</p>
          <button
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Types</option>
                  {NOTIFICATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("ALL");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="bg-white p-6 rounded-md shadow text-center">
              <p className="text-gray-500">
                No notifications found.{" "}
                {filter !== "ALL" || searchTerm
                  ? "Try adjusting your filters."
                  : "Create your first notification!"}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNotifications.map((notification) => (
                      <tr
                        key={notification.id}
                        className={notification.isRead ? "" : "bg-indigo-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {notification.content}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {notification.user?.firstName}{" "}
                            {notification.user?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {notification.user?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getNotificationTypeColor(
                              notification.type
                            )}`}
                          >
                            {notification.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(
                            notification.createdAt
                          ).toLocaleDateString()}
                          <div className="text-xs">
                            {new Date(
                              notification.createdAt
                            ).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              notification.isRead
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {notification.isRead ? "Read" : "Unread"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() =>
                                handleMarkAsRead(
                                  notification.id,
                                  notification.isRead
                                )
                              }
                              className={`text-xs ${
                                notification.isRead
                                  ? "text-yellow-600 hover:text-yellow-800"
                                  : "text-green-600 hover:text-green-800"
                              }`}
                            >
                              {notification.isRead
                                ? "Mark Unread"
                                : "Mark Read"}
                            </button>
                            <Link
                              href={`/admin/notifications/${notification.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
