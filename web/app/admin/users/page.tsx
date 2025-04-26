"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "../components/data-table";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This function will refetch the users
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/admin/users");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const columns = [
    {
      key: "fullName",
      header: "Name",
      render: (item) => `${item.firstName} ${item.lastName}`,
    },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "intrest", header: "Interest" },
    {
      key: "createdAt",
      header: "Joined",
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  const deleteUser = async (id) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      // Update the local state
      setUsers(users.filter((user) => user.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete user:", error);
      return { success: false, error: error.message };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <h3 className="text-lg font-semibold mb-2">Error loading users</h3>
        <p>{error}</p>
        <button
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add New User
        </Link>
      </div>

      <DataTable
        data={users}
        columns={columns}
        baseUrl="/admin/users"
        deleteHandler={deleteUser}
      />
    </div>
  );
}
