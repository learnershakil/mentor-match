"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EVENT_TYPES = ["Meeting", "Session", "Deadline"];

export default function EventEditPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const isNewEvent = id === "new";

  const [event, setEvent] = useState(null);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    studentId: "",
    mentorId: "",
    title: "",
    description: "",
    startTime: "",
    eventType: "Meeting",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch students and mentors for dropdowns
        const [studentsResponse, mentorsResponse] = await Promise.all([
          fetch("/api/admin/students-list"),
          fetch("/api/admin/mentors-list"),
        ]);

        if (!studentsResponse.ok || !mentorsResponse.ok) {
          throw new Error("Failed to fetch required data");
        }

        const [studentsData, mentorsData] = await Promise.all([
          studentsResponse.json(),
          mentorsResponse.json(),
        ]);

        setStudents(studentsData);
        setMentors(mentorsData);

        // If editing an existing event, fetch its data
        if (!isNewEvent) {
          const eventResponse = await fetch(`/api/admin/events/${id}`);
          if (!eventResponse.ok) {
            throw new Error("Failed to fetch event");
          }

          const eventData = await eventResponse.json();
          setEvent(eventData);

          // Format date for the form input
          const startTime = new Date(eventData.startTime)
            .toISOString()
            .slice(0, 16);

          // Populate form with event data
          setFormData({
            studentId: eventData.studentId,
            mentorId: eventData.mentorId,
            title: eventData.title,
            description: eventData.description || "",
            startTime: startTime,
            eventType: eventData.eventType,
          });
        } else {
          // For new events, set default time (now)
          const now = new Date();
          setFormData((prev) => ({
            ...prev,
            startTime: now.toISOString().slice(0, 16),
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
  }, [id, isNewEvent]);

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
      const url = isNewEvent ? "/api/admin/events" : `/api/admin/events/${id}`;
      const method = isNewEvent ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save event");
      }

      router.push("/admin/events");
      router.refresh();
    } catch (err) {
      console.error("Error saving event:", err);
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
          {isNewEvent ? "Create New Event" : "Edit Event"}
        </h1>
        <Link
          href="/admin/events"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back to Events
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
              htmlFor="studentId"
            >
              Student *
            </label>
            <select
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.user.firstName} {student.user.lastName} (
                  {student.user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
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

          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="startTime"
            >
              Date & Time *
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
              htmlFor="eventType"
            >
              Event Type *
            </label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
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
            {isSaving ? "Saving..." : "Save Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
