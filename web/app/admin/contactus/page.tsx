"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define the types based on the schema
const SUBJECT_TYPES = [
  "GeneralInquiry",
  "TechnicalSupport",
  "BillingQuestion",
  "PartnershipOppurtunity",
  "Feedback",
];

export default function ContactUsPage() {
  const [contactItems, setContactItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/admin/contactus");

        if (!response.ok) {
          throw new Error("Failed to fetch contact submissions");
        }

        const data = await response.json();
        setContactItems(data);
      } catch (err) {
        console.error("Error fetching contact data:", err);
        // @ts-ignore
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactData();
  }, []);

  // @ts-ignore
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this contact submission?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/contactus/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete contact submission");
      }

      // Remove from state
      // @ts-ignore
      setContactItems(contactItems.filter((item) => item.id !== id));

      // If the deleted item was selected, clear the selection
      // @ts-ignore
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Error deleting contact submission:", err);
      // @ts-ignore
      alert(err.message);
    }
  };

  // @ts-ignore
  const getSubjectBadgeColor = (subject) => {
    switch (subject) {
      case "GeneralInquiry":
        return "bg-blue-100 text-blue-800";
      case "TechnicalSupport":
        return "bg-purple-100 text-purple-800";
      case "BillingQuestion":
        return "bg-green-100 text-green-800";
      case "PartnershipOppurtunity":
        return "bg-yellow-100 text-yellow-800";
      case "Feedback":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter and search contact items
  const filteredContactItems = contactItems.filter((item) => {
    // Handle subject filter
    // @ts-ignore
    if (filter !== "ALL" && item.subject !== filter) {
      return false;
    }

    // Handle search
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      return (
        // @ts-ignore
        item.firstname.toLowerCase().includes(term) ||
        // @ts-ignore
        item.lastname.toLowerCase().includes(term) ||
        // @ts-ignore
        item.email.toLowerCase().includes(term) ||
        // @ts-ignore
        item.message.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // @ts-ignore
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    // @ts-ignore
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Contact Us Submissions</h1>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
            <p className="text-gray-600">Loading contact submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contact Us Submissions</h1>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-md text-red-800">
          <h3 className="text-lg font-semibold mb-2">
            Error loading contact submissions
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex flex-col gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Subjects</option>
                    {SUBJECT_TYPES.map((type) => (
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
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredContactItems.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No contact submissions found.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {filteredContactItems.map((item) => (
                    
                    <li
                    // @ts-ignore
                      key={item.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        // @ts-ignore
                        selectedItem?.id === item.id ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                              {/* @ts-ignore */}
                              {item.firstname.charAt(0)}
                              {/* @ts-ignore */}
                              {item.lastname.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {/* @ts-ignore */}
                                {item.firstname} {item.lastname}
                              </div>
                              <div className="text-sm text-gray-500">
                                {/* @ts-ignore */}
                                {item.email}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getSubjectBadgeColor(
                              // @ts-ignore
                              item.subject
                            )}`}
                          >
                            {/* @ts-ignore */}
                            {item.subject}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {/* @ts-ignore */}
                          {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {/* @ts-ignore */}
                      {selectedItem.firstname} {selectedItem.lastname}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {/* @ts-ignore */}
                      {selectedItem.email}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getSubjectBadgeColor(
                          // @ts-ignore
                          selectedItem.subject
                        )}`}
                      >
                        {/* @ts-ignore */}
                        {selectedItem.subject}
                      </span>
                    </div>
                  </div>
                  <button
                  /* @ts-ignore */
                    onClick={() => handleDelete(selectedItem.id)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="Delete contact"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {/* @ts-ignore */}
                  Submitted on {formatDate(selectedItem.createdAt)}
                </div>
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Message</h3>
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {/* @ts-ignore */}
                    {selectedItem.message}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <a
                  /* @ts-ignore */
                    href={`mailto:${selectedItem.email}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Reply via Email
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
                <p className="text-gray-500">
                  {filteredContactItems.length > 0
                    ? "Select a contact submission to view details"
                    : "No contact submissions available"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
