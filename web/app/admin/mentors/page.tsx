"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Add a timeout to ensure API is ready
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("Fetching mentors from client...");
        const response = await fetch("/api/admin/mentors", {
          cache: "no-store",
        });

        if (!response.ok) {
          let errorMessage = "Failed to fetch mentors";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error("API returned error:", errorData);
          } catch (jsonError) {
            console.error("Error parsing error response:", jsonError);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`Client received ${data.length} mentors`);
        setMentors(data);
      } catch (err) {
        console.error("Error fetching mentors:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this mentor? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mentors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete mentor");
      }

      // Update the state
      setMentors(mentors.filter((mentor) => mentor.id !== id));
    } catch (error) {
      console.error("Error deleting mentor:", error);
      alert(error.message);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mentors</h1>
          <Link
            href="/admin/mentors/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add New Mentor
          </Link>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
            <p className="text-gray-600">Loading mentors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mentors</h1>
        <Link
          href="/admin/mentors/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add New Mentor
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-md text-red-800">
          <h3 className="text-lg font-semibold mb-2">Error loading mentors</h3>
          <p>{error}</p>
          <button
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : mentors.length === 0 ? (
        <div className="bg-white p-6 rounded-md shadow text-center">
          <p className="text-gray-500">
            No mentors found. Add your first mentor!
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mentor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mentors.map((mentor) => (
                <tr key={mentor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {mentor.user.image && (
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={mentor.user.image}
                            alt={`${mentor.user.firstName} ${mentor.user.lastName}`}
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {mentor.user.firstName} {mentor.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {mentor.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {mentor.specialties?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {mentor.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No specialties</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {mentor.jobTitle || "Not specified"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {mentor.company || "No company"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {mentor.experience
                        ? `${mentor.experience} years`
                        : "Not specified"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900 mr-1">
                        {mentor.rating.toFixed(1)}
                      </div>
                      <span className="text-yellow-400">★</span>
                      <div className="text-xs text-gray-500 ml-1">
                        ({mentor.reviewCount} reviews)
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/mentors/${mentor.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(mentor.id)}
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
