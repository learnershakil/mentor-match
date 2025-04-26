"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WeeklyProgressEditPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const isNewRecord = id === "new";

  const [progressData, setProgressData] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(!isNewRecord);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [subTopics, setSubTopics] = useState([{ topic: "", progress: 0 }]);

  // Form data
  const [formData, setFormData] = useState({
    userId: "",
    goals: 0,
    Sessions: 0,
    SessionsE: 0,
    projects: 0,
    projectsE: 0,
    HoursSpent: 0,
    HoursSpentE: 0,
    skills: 0,
    skillsE: 0,
  });

  // Fetch data based on whether we're creating or editing
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // If creating a new record, fetch available users
        if (isNewRecord) {
          const response = await fetch("/api/admin/users-without-progress");
          if (!response.ok) {
            throw new Error("Failed to fetch available users");
          }
          const users = await response.json();
          setAvailableUsers(users);
          setIsLoading(false);
        }
        // If editing, fetch the existing progress data
        else {
          const response = await fetch(`/api/admin/weekly-progress/${id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch weekly progress");
          }

          const data = await response.json();
          setProgressData(data);

          // Populate form with progress data
          setFormData({
            userId: data.userId,
            goals: data.goals || 0,
            Sessions: data.Sessions || 0,
            SessionsE: data.SessionsE || 0,
            projects: data.projects || 0,
            projectsE: data.projectsE || 0,
            HoursSpent: data.HoursSpent || 0,
            HoursSpentE: data.HoursSpentE || 0,
            skills: data.skills || 0,
            skillsE: data.skillsE || 0,
          });

          // Populate subtopics
          if (data.subTopics && data.subTopics.length > 0) {
            setSubTopics(
              data.subTopics.map((topic) => ({
                id: topic.id,
                topic: topic.topic,
                progress: topic.progress,
              }))
            );
          }

          setIsLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isNewRecord]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("goals") || name.includes("skills")
          ? parseInt(value)
          : parseFloat(value),
    }));
  };

  // Handle subtopic changes
  const handleSubtopicChange = (index, field, value) => {
    const updatedSubTopics = [...subTopics];
    updatedSubTopics[index] = {
      ...updatedSubTopics[index],
      [field]: field === "progress" ? parseInt(value) : value,
    };
    setSubTopics(updatedSubTopics);
  };

  // Add new subtopic
  const addSubtopic = () => {
    setSubTopics([...subTopics, { topic: "", progress: 0 }]);
  };

  // Remove subtopic
  const removeSubtopic = (index) => {
    if (subTopics.length > 1) {
      const updatedSubTopics = [...subTopics];
      updatedSubTopics.splice(index, 1);
      setSubTopics(updatedSubTopics);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        subTopics: subTopics.filter((topic) => topic.topic.trim() !== ""),
      };

      const url = isNewRecord
        ? "/api/admin/weekly-progress"
        : `/api/admin/weekly-progress/${id}`;

      const method = isNewRecord ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save weekly progress");
      }

      router.push("/admin/weekly-progress");
      router.refresh();
    } catch (err) {
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
          {isNewRecord ? "Add New Weekly Progress" : "Edit Weekly Progress"}
        </h1>
        <Link
          href="/admin/weekly-progress"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back to Progress List
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 mb-6"
      >
        {/* User Selection (only for new records) */}
        {isNewRecord ? (
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="userId"
            >
              Select User
            </label>
            <select
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a user...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="text-sm text-orange-500 mt-1">
                All users already have weekly progress records.
              </p>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              User
            </label>
            <div className="py-2 px-3 bg-gray-100 rounded">
              {progressData?.user.firstName} {progressData?.user.lastName} (
              {progressData?.user.email})
            </div>
          </div>
        )}

        {/* Main Progress Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="goals"
            >
              Goals Completion (%)
            </label>
            <input
              type="number"
              id="goals"
              name="goals"
              min="0"
              max="100"
              value={formData.goals}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Sessions */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="Sessions"
              >
                Sessions
              </label>
              <input
                type="number"
                id="Sessions"
                name="Sessions"
                min="0"
                value={formData.Sessions}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="SessionsE"
              >
                Expected Sessions
              </label>
              <input
                type="number"
                id="SessionsE"
                name="SessionsE"
                min="0"
                step="0.5"
                value={formData.SessionsE}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>

          {/* Projects */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="projects"
              >
                Projects
              </label>
              <input
                type="number"
                id="projects"
                name="projects"
                min="0"
                value={formData.projects}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="projectsE"
              >
                Expected Projects
              </label>
              <input
                type="number"
                id="projectsE"
                name="projectsE"
                min="0"
                step="0.5"
                value={formData.projectsE}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>

          {/* Hours Spent */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="HoursSpent"
              >
                Hours Spent
              </label>
              <input
                type="number"
                id="HoursSpent"
                name="HoursSpent"
                min="0"
                value={formData.HoursSpent}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="HoursSpentE"
              >
                Expected Hours
              </label>
              <input
                type="number"
                id="HoursSpentE"
                name="HoursSpentE"
                min="0"
                step="0.5"
                value={formData.HoursSpentE}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="skills"
              >
                Skills Improvement (%)
              </label>
              <input
                type="number"
                id="skills"
                name="skills"
                min="0"
                max="100"
                value={formData.skills}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="skillsE"
              >
                Expected Skills (%)
              </label>
              <input
                type="number"
                id="skillsE"
                name="skillsE"
                min="0"
                max="100"
                step="0.5"
                value={formData.skillsE}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
        </div>

        {/* Subtopics */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 text-sm font-bold">
              Subtopics
            </label>
            <button
              type="button"
              onClick={addSubtopic}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
            >
              Add Subtopic
            </button>
          </div>

          {subTopics.map((topic, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="Topic name"
                value={topic.topic}
                onChange={(e) =>
                  handleSubtopicChange(index, "topic", e.target.value)
                }
                className="shadow appearance-none border rounded flex-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <input
                type="number"
                placeholder="Progress %"
                min="0"
                max="100"
                value={topic.progress}
                onChange={(e) =>
                  handleSubtopicChange(index, "progress", e.target.value)
                }
                className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <button
                type="button"
                onClick={() => removeSubtopic(index)}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                disabled={subTopics.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || (isNewRecord && !formData.userId)}
            className={`px-4 py-2 ${
              isSaving || (isNewRecord && !formData.userId)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded-md`}
          >
            {isSaving ? "Saving..." : "Save Progress"}
          </button>
        </div>
      </form>
    </div>
  );
}
