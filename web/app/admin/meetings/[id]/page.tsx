"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MEETING_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"];
const CATEGORIES = [
  "WebDevelopment",
  "AiMl",
  "AppDevelopment",
  "CyberSecurity",
];

export default function MeetingEditPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const isNewMeeting = id === "new";

  const [meeting, setMeeting] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    mentorId: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    status: "SCHEDULED",
    notes: "",
    recordingUrl: "",
    category: "WebDevelopment",
    joinLink: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch mentors for dropdown
        const mentorsResponse = await fetch("/api/admin/mentors-list");
        if (!mentorsResponse.ok) {
          throw new Error("Failed to fetch mentors");
        }
        const mentorsData = await mentorsResponse.json();
        setMentors(mentorsData);

        // If editing an existing meeting, fetch its data
        if (!isNewMeeting) {
          const meetingResponse = await fetch(`/api/admin/meetings/${id}`);
          if (!meetingResponse.ok) {
            throw new Error("Failed to fetch meeting");
          }

          const meetingData = await meetingResponse.json();
          setMeeting(meetingData);

          // Format dates for form inputs
          const startTime = new Date(meetingData.startTime)
            .toISOString()
            .slice(0, 16);
          const endTime = new Date(meetingData.endTime)
            .toISOString()
            .slice(0, 16);

          // Populate form with meeting data
          setFormData({
            mentorId: meetingData.mentorId,
            title: meetingData.title,
            description: meetingData.description || "",
            startTime: startTime,
            endTime: endTime,
            status: meetingData.status,
            notes: meetingData.notes || "",
            recordingUrl: meetingData.recordingUrl || "",
            category: meetingData.category,
            joinLink: meetingData.joinLink || "",
          });
        } else {
          // For new meetings, set default times (now and 1 hour from now)
          const now = new Date();
          const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

          setFormData((prev) => ({
            ...prev,
            startTime: now.toISOString().slice(0, 16),
            endTime: oneHourLater.toISOString().slice(0, 16),
          }));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isNewMeeting]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const url = isNewMeeting
        ? "/api/admin/meetings"
        : `/api/admin/meetings/${id}`;
      const method = isNewMeeting ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save meeting");
      }

      router.push("/admin/meetings");
      router.refresh();
    } catch (err) {
      console.error("Error saving meeting:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isNewMeeting ? "Create New Meeting" : "Edit Meeting"}
        </h1>
        <Link
          href="/admin/meetings"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back to Meetings
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>{" "}
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 mb-6"
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="mentorId"
          >
            Mentor *
          </label>
          <select
            id="mentorId"
            name="mentorId"
            value={formData.mentorId}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a mentor...</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.user.firstName} {mentor.user.lastName} (
                {mentor.user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="title"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="startTime"
            >
              Start Time *
            </label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="endTime"
            >
              End Time *
            </label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="status"
            >
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              {MEETING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="category"
            >
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="joinLink"
          >
            Meeting Link
          </label>
          <input
            type="url"
            id="joinLink"
            name="joinLink"
            value={formData.joinLink}
            onChange={handleChange}
            placeholder="https://zoom.us/j/1234567890"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="recordingUrl"
          >
            Recording URL
          </label>
          <input
            type="url"
            id="recordingUrl"
            name="recordingUrl"
            value={formData.recordingUrl}
            onChange={handleChange}
            placeholder="https://example.com/recording"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="notes"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-4 py-2 ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded-md`}
          >
            {isSaving ? "Saving..." : "Save Meeting"}
          </button>
        </div>
      </form>
    </div>
  );
}
