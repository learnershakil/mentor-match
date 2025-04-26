"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Add a simple timeout to ensure the API has time to initialize
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("Fetching assignments from client...");
        const response = await fetch("/api/admin/assignments", {
          cache: "no-store", // Disable caching
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          let errorMessage = "Failed to fetch assignments";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error("API returned error:", errorData);
          } catch (jsonError) {
            console.error("Error parsing API error response:", jsonError);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`Client received ${data.length} assignments`);
        setAssignments(data);
      } catch (err) {
        console.error("Error in client:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this assignment? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/assignments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }

      // Remove the deleted item from the list
      setAssignments(assignments.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert(error.message);
    }
  };

  // Display empty state instead of error initially
  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Assignments</h1>
          <Link
            href="/admin/assignments/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add New Assignment
          </Link>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
            <p className="text-gray-600">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <Link
          href="/admin/assignments/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add New Assignment
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-md text-red-800">
          <h3 className="text-lg font-semibold mb-2">
            Error loading assignments
          </h3>
          <p>{error}</p>
          <button
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-6 rounded-md shadow text-center">
          <p className="text-gray-500">
            No assignments found. Create your first assignment!
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mentor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
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
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assignment.student?.user?.firstName}{" "}
                      {assignment.student?.user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignment.student?.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assignment.mentor?.user?.firstName}{" "}
                      {assignment.mentor?.user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignment.mentor?.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        assignment.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : assignment.status === "SUBMITTED"
                          ? "bg-blue-100 text-blue-800"
                          : assignment.status === "LATE"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/assignments/${assignment.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
