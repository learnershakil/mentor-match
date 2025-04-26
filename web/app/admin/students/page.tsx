"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "../components/data-table";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/admin/students");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch students");
        }

        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const columns = [
    {
      key: "name",
      header: "Student Name",
      render: (item) => `${item.user.firstName} ${item.user.lastName}`,
    },
    {
      key: "email",
      header: "Email",
      render: (item) => item.user.email,
    },
    {
      key: "level",
      header: "Skill Level",
      render: (item) => item.level,
    },
    {
      key: "interests",
      header: "Learning Interests",
      render: (item) => item.learningInterests.join(", ") || "None specified",
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (item) => new Date(item.user.createdAt).toLocaleDateString(),
    },
  ];

  const deleteStudent = async (id) => {
    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete student");
      }

      // Update the local state
      setStudents(students.filter((student) => student.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete student:", error);
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
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <h3 className="text-lg font-semibold mb-2">Error loading students</h3>
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
        <h1 className="text-2xl font-bold">Students</h1>
        <Link
          href="/admin/students/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add New Student
        </Link>
      </div>

      <DataTable
        data={students}
        columns={columns}
        baseUrl="/admin/students"
        deleteHandler={deleteStudent}
      />
    </div>
  );
}
