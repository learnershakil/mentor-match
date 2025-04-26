"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentEditPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const isNewStudent = id === "new";

  const [student, setStudent] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(!isNewStudent);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // For entity management
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [events, setEvents] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [mentors, setMentors] = useState([]);

  // Additional entity management states
  const [skillMasteries, setSkillMasteries] = useState([]);
  const [learningGoals, setLearningGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [showSkillMasteryForm, setShowSkillMasteryForm] = useState(false);
  const [showLearningGoalForm, setShowLearningGoalForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [selectedProgressId, setSelectedProgressId] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    userId: "",
    learningInterests: [],
    level: "BEGINNER",
  });

  // Fetch student data if editing existing student
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // If creating a new student, fetch available users
        if (isNewStudent) {
          const response = await fetch("/api/admin/non-students");
          if (!response.ok) {
            throw new Error("Failed to fetch available users");
          }
          const users = await response.json();
          setAvailableUsers(users);
        }
        // If editing, fetch the student details
        else {
          const response = await fetch(`/api/admin/students/${id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch student");
          }

          const studentData = await response.json();
          setStudent(studentData);

          // Populate form with student data
          setFormData({
            userId: studentData.userId,
            learningInterests: studentData.learningInterests || [],
            level: studentData.level || "BEGINNER",
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // If editing, also fetch mentors for assignment creation
    if (!isNewStudent) {
      const fetchMentors = async () => {
        try {
          const response = await fetch("/api/admin/mentors");
          if (response.ok) {
            const data = await response.json();
            setMentors(data);
          }
        } catch (error) {
          console.error("Failed to fetch mentors:", error);
        }
      };

      fetchMentors();
    }
  }, [id, isNewStudent]);

  // Refresh entity data after changes
  const refreshStudentData = async () => {
    if (isNewStudent) return;

    try {
      const response = await fetch(`/api/admin/students/${id}`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data);
        setAssignments(data.assignments || []);
        setProgress(data.progress || []);
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to refresh student data:", error);
    }
  };

  // Load entity data when student is loaded
  useEffect(() => {
    if (student) {
      setAssignments(student.assignments || []);
      setProgress(student.progress || []);
      setEvents(student.events || []);

      // Extract related entities from progress records
      const allSkillMasteries = [];
      const allLearningGoals = [];
      const allProjects = [];
      const allCertificates = [];

      student.progress?.forEach((p) => {
        if (p.skill_mastery) allSkillMasteries.push(...p.skill_mastery);
        if (p.learning_goals) allLearningGoals.push(...p.learning_goals);
        if (p.projects) allProjects.push(...p.projects);
        if (p.certificates) allCertificates.push(...p.certificates);
      });

      setSkillMasteries(allSkillMasteries);
      setLearningGoals(allLearningGoals);
      setProjects(allProjects);
      setCertificates(allCertificates);
    }
  }, [student]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle interest changes (multiple selection)
  const handleInterestChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      if (checked) {
        return {
          ...prev,
          learningInterests: [...prev.learningInterests, value],
        };
      } else {
        return {
          ...prev,
          learningInterests: prev.learningInterests.filter(
            (interest) => interest !== value
          ),
        };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const url = isNewStudent
        ? "/api/admin/students"
        : `/api/admin/students/${id}`;

      const method = isNewStudent ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save student");
      }

      router.push("/admin/students");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle entity creation/editing
  const handleAssignmentSubmit = async (assignmentData) => {
    try {
      const isEditing = !!assignmentData.id;
      const url = isEditing
        ? `/api/admin/assignments/${assignmentData.id}`
        : "/api/admin/assignments";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assignmentData,
          studentId: id,
        }),
      });

      if (!response.ok) throw new Error("Failed to save assignment");

      setShowAssignmentForm(false);
      setCurrentEntity(null);
      refreshStudentData();
    } catch (error) {
      console.error("Error saving assignment:", error);
      setError(error.message);
    }
  };

  const handleProgressSubmit = async (progressData) => {
    try {
      const isEditing = !!progressData.id;
      const url = isEditing
        ? `/api/admin/progress/${progressData.id}`
        : "/api/admin/progress";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...progressData,
          studentId: id,
        }),
      });

      if (!response.ok) throw new Error("Failed to save progress");

      setShowProgressForm(false);
      setCurrentEntity(null);
      refreshStudentData();
    } catch (error) {
      console.error("Error saving progress:", error);
      setError(error.message);
    }
  };

  const handleEventSubmit = async (eventData) => {
    try {
      const isEditing = !!eventData.id;
      const url = isEditing
        ? `/api/admin/events/${eventData.id}`
        : "/api/admin/events";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventData,
          studentId: id,
        }),
      });

      if (!response.ok) throw new Error("Failed to save event");

      setShowEventForm(false);
      setCurrentEntity(null);
      refreshStudentData();
    } catch (error) {
      console.error("Error saving event:", error);
      setError(error.message);
    }
  };

  const handleSkillMasterySubmit = async (data) => {
    try {
      const isEditing = !!data.id;
      const url = isEditing
        ? `/api/admin/skillMastery/${data.id}`
        : "/api/admin/skillMastery";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save skill mastery");

      setShowSkillMasteryForm(false);
      setCurrentEntity(null);
      refreshStudentData();
    } catch (error) {
      console.error("Error saving skill mastery:", error);
      setError(error.message);
    }
  };

  const handleLearningGoalSubmit = async (data) => {
    try {
      const isEditing = !!data.id;
      const url = isEditing
        ? `/api/admin/learningGoal/${data.id}`
        : "/api/admin/learningGoal";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save learning goal");

      setShowLearningGoalForm(false);
      setCurrentEntity(null);
      refreshStudentData();
    } catch (error) {
      console.error("Error saving learning goal:", error);
      setError(error.message);
    }
  };

  const handleProjectSubmit = async (data) => {
    try {
      const isEditing = !!data.id;
      const url = isEditing
        ? `/api/admin/project/${data.id}`
        : "/api/admin/project";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save project");

      setShowProjectForm(false);
      setCurrentEntity(null);
      refreshStudentData();
    } catch (error) {
      console.error("Error saving project:", error);
      setError(error.message);
    }
  };

  const handleCertificateSubmit = async (data) => {
    try {
      const isEditing = !!data.id;
      const url = isEditing
        ? `/api/admin/certificate/${data.id}`
        : "/api/admin/certificate";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save certificate");

      setShowCertificateForm(false);
      setCurrentEntity(null);
      refreshStudentData();
    } catch (error) {
      console.error("Error saving certificate:", error);
      setError(error.message);
    }
  };

  // Delete entity
  const handleDeleteEntity = async (entityType, entityId) => {
    if (!confirm(`Are you sure you want to delete this ${entityType}?`)) return;

    try {
      const response = await fetch(`/api/admin/${entityType}/${entityId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(`Failed to delete ${entityType}`);

      refreshStudentData();
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      setError(error.message);
    }
  };

  // Edit entity
  const handleEditEntity = (entityType, entity) => {
    setCurrentEntity(entity);

    if (entityType === "assignments") {
      setShowAssignmentForm(true);
    } else if (entityType === "progress") {
      setShowProgressForm(true);
    } else if (entityType === "events") {
      setShowEventForm(true);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading student data...</div>;
  }

  // Available interests for checkboxes
  const interestOptions = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "Mobile Development",
    "Machine Learning",
    "Data Science",
    "UI/UX Design",
    "DevOps",
    "Cybersecurity",
    "Blockchain",
    "Cloud Computing",
  ];

  // Initial form for new entities
  const newAssignment = {
    title: "",
    description: "",
    mentorId: "",
    dueDate: new Date().toISOString().split("T")[0],
    status: "PENDING",
  };

  const newProgress = {
    roadmapTopicId: "",
    totalSessions: 0,
    learningHours: 0,
    ts_lastMonth: 0,
    lh_lastMonth: 0,
    comp_projects: 0,
    cp_lastMonth: 0,
  };

  const newEvent = {
    title: "",
    description: "",
    mentorId: "",
    startTime: new Date().toISOString().split("T")[0],
    eventType: "Meeting",
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isNewStudent ? "Add New Student" : "Edit Student"}
        </h1>
        <Link
          href="/admin/students"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back to Students
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!isNewStudent && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px">
            <button
              className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === "info"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("info")}
            >
              Student Info
            </button>
            <button
              className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === "assignments"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments
            </button>
            <button
              className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === "progress"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("progress")}
            >
              Progress
            </button>
            <button
              className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === "events"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("events")}
            >
              Events
            </button>
            <button
              className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === "skills"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("skills")}
            >
              Skills
            </button>
            <button
              className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === "goals"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("goals")}
            >
              Goals
            </button>
            <button
              className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === "projects"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("projects")}
            >
              Projects
            </button>
            <button
              className={`mr-2 py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === "certificates"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("certificates")}
            >
              Certificates
            </button>
          </nav>
        </div>
      )}

      {/* Student Info Tab */}
      {(isNewStudent || activeTab === "info") && (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          {isNewStudent ? (
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="userId"
              >
                Select User
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
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
                <p className="text-sm text-yellow-600 mt-1">
                  No available users. All users already have student profiles.
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Student
              </label>
              <div className="p-3 bg-gray-100 rounded">
                {student?.user.firstName} {student?.user.lastName} (
                {student?.user.email})
              </div>
            </div>
          )}

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="level"
            >
              Skill Level
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Learning Interests
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {interestOptions.map((interest) => (
                <div key={interest} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`interest-${interest}`}
                    value={interest}
                    checked={formData.learningInterests.includes(interest)}
                    onChange={handleInterestChange}
                    className="mr-2"
                  />
                  <label htmlFor={`interest-${interest}`}>{interest}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={isSaving || (isNewStudent && !formData.userId)}
            >
              {isSaving ? "Saving..." : "Save Student"}
            </button>
          </div>
        </form>
      )}

      {/* Assignments Tab */}
      {!isNewStudent && activeTab === "assignments" && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Assignments</h2>
            <button
              onClick={() => {
                setCurrentEntity(null);
                setShowAssignmentForm(true);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Assignment
            </button>
          </div>

          {/* Assignments List */}
          {assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
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
                        {assignment.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
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
                        <button
                          onClick={() =>
                            handleEditEntity("assignments", assignment)
                          }
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEntity("assignments", assignment.id)
                          }
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
          ) : (
            <p className="text-gray-500">No assignments found.</p>
          )}

          {/* Assignment Form Modal */}
          {showAssignmentForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                  {currentEntity ? "Edit Assignment" : "Add New Assignment"}
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      id: currentEntity?.id,
                      title: formData.get("title"),
                      description: formData.get("description"),
                      mentorId: formData.get("mentorId"),
                      dueDate: formData.get("dueDate"),
                      status: formData.get("status"),
                    };
                    handleAssignmentSubmit(data);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={currentEntity?.title || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={currentEntity?.description || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Mentor
                    </label>
                    <select
                      name="mentorId"
                      defaultValue={currentEntity?.mentorId || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select a mentor...</option>
                      {mentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.user.firstName} {mentor.user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      defaultValue={
                        currentEntity?.dueDate
                          ? new Date(currentEntity.dueDate)
                              .toISOString()
                              .split("T")[0]
                          : new Date().toISOString().split("T")[0]
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={currentEntity?.status || "PENDING"}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="PENDING">Pending</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="LATE">Late</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAssignmentForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {!isNewStudent && activeTab === "progress" && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Progress</h2>
            <button
              onClick={() => {
                setCurrentEntity(null);
                setShowProgressForm(true);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Progress
            </button>
          </div>

          {/* Progress List */}
          {progress.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Learning Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed Projects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {progress.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.totalSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.learningHours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.comp_projects}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditEntity("progress", p)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEntity("progress", p.id)}
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
          ) : (
            <p className="text-gray-500">No progress records found.</p>
          )}

          {/* Progress Form Modal */}
          {showProgressForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                  {currentEntity ? "Edit Progress" : "Add New Progress"}
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      id: currentEntity?.id,
                      roadmapTopicId:
                        formData.get("roadmapTopicId") || "default-topic",
                      totalSessions: parseInt(formData.get("totalSessions")),
                      ts_lastMonth: parseInt(formData.get("ts_lastMonth")),
                      learningHours: parseInt(formData.get("learningHours")),
                      lh_lastMonth: parseInt(formData.get("lh_lastMonth")),
                      comp_projects: parseInt(formData.get("comp_projects")),
                      cp_lastMonth: parseInt(formData.get("cp_lastMonth")),
                    };
                    handleProgressSubmit(data);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Topic ID
                    </label>
                    <input
                      type="text"
                      name="roadmapTopicId"
                      defaultValue={
                        currentEntity?.roadmapTopicId || "default-topic"
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Total Sessions
                      </label>
                      <input
                        type="number"
                        name="totalSessions"
                        defaultValue={currentEntity?.totalSessions || 0}
                        min="0"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Last Month Sessions
                      </label>
                      <input
                        type="number"
                        name="ts_lastMonth"
                        defaultValue={currentEntity?.ts_lastMonth || 0}
                        min="0"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Learning Hours
                      </label>
                      <input
                        type="number"
                        name="learningHours"
                        defaultValue={currentEntity?.learningHours || 0}
                        min="0"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Last Month Hours
                      </label>
                      <input
                        type="number"
                        name="lh_lastMonth"
                        defaultValue={currentEntity?.lh_lastMonth || 0}
                        min="0"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Completed Projects
                      </label>
                      <input
                        type="number"
                        name="comp_projects"
                        defaultValue={currentEntity?.comp_projects || 0}
                        min="0"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Last Month Projects
                      </label>
                      <input
                        type="number"
                        name="cp_lastMonth"
                        defaultValue={currentEntity?.cp_lastMonth || 0}
                        min="0"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowProgressForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {!isNewStudent && activeTab === "events" && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Events</h2>
            <button
              onClick={() => {
                setCurrentEntity(null);
                setShowEventForm(true);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Event
            </button>
          </div>

          {/* Events List */}
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(event.startTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.eventType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditEntity("events", event)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEntity("events", event.id)}
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
          ) : (
            <p className="text-gray-500">No events found.</p>
          )}

          {/* Event Form Modal */}
          {showEventForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                  {currentEntity ? "Edit Event" : "Add New Event"}
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      id: currentEntity?.id,
                      title: formData.get("title"),
                      description: formData.get("description"),
                      mentorId: formData.get("mentorId"),
                      startTime: new Date(
                        formData.get("startTime")
                      ).toISOString(),
                      eventType: formData.get("eventType"),
                    };
                    handleEventSubmit(data);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={currentEntity?.title || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={currentEntity?.description || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Mentor
                    </label>
                    <select
                      name="mentorId"
                      defaultValue={currentEntity?.mentorId || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select a mentor...</option>
                      {mentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.user.firstName} {mentor.user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      defaultValue={
                        currentEntity?.startTime
                          ? new Date(currentEntity.startTime)
                              .toISOString()
                              .slice(0, 16)
                          : new Date().toISOString().slice(0, 16)
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Event Type
                    </label>
                    <select
                      name="eventType"
                      defaultValue={currentEntity?.eventType || "Meeting"}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="Meeting">Meeting</option>
                      <option value="Session">Session</option>
                      <option value="Deadline">Deadline</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skills Mastery Tab */}
      {!isNewStudent && activeTab === "skills" && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Skill Mastery</h2>
            <div className="flex items-center space-x-2">
              {progress.length > 0 && (
                <select
                  onChange={(e) => setSelectedProgressId(e.target.value)}
                  value={selectedProgressId || ""}
                  className="border rounded py-1 px-2 text-sm"
                >
                  <option value="">Select progress record...</option>
                  {progress.map((p) => (
                    <option key={p.id} value={p.id}>
                      Progress #{p.id.substring(0, 8)}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => {
                  if (!selectedProgressId && progress.length > 0) {
                    setSelectedProgressId(progress[0].id);
                  }
                  setCurrentEntity(null);
                  setShowSkillMasteryForm(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                disabled={progress.length === 0}
              >
                Add Skill
              </button>
            </div>
          </div>

          {progress.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-yellow-700">
                You need to create a progress record first before adding skills.
              </p>
            </div>
          ) : skillMasteries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skill
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mastery Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress Record
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {skillMasteries.map((skill) => (
                    <tr key={skill.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {skill.skill}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${skill.masteryLevel}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {skill.masteryLevel}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {skill.progressId.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() =>
                            handleEditEntity("skillMastery", skill)
                          }
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEntity("skillMastery", skill.id)
                          }
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
          ) : (
            <p className="text-gray-500">No skill mastery records found.</p>
          )}

          {/* Skill Mastery Form Modal */}
          {showSkillMasteryForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                  {currentEntity ? "Edit Skill Mastery" : "Add New Skill"}
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      id: currentEntity?.id,
                      progressId: formData.get("progressId"),
                      skill: formData.get("skill"),
                      masteryLevel: parseInt(formData.get("masteryLevel")),
                    };
                    handleSkillMasterySubmit(data);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Progress Record
                    </label>
                    <select
                      name="progressId"
                      defaultValue={
                        currentEntity?.progressId || selectedProgressId || ""
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select progress record...</option>
                      {progress.map((p) => (
                        <option key={p.id} value={p.id}>
                          Progress #{p.id.substring(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Skill Name
                    </label>
                    <input
                      type="text"
                      name="skill"
                      defaultValue={currentEntity?.skill || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Mastery Level (0-100%)
                    </label>
                    <input
                      type="range"
                      name="masteryLevel"
                      min="0"
                      max="100"
                      defaultValue={currentEntity?.masteryLevel || "0"}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      onChange={(e) =>
                        (document.getElementById("masteryValue").textContent =
                          e.target.value + "%")
                      }
                    />
                    <span id="masteryValue" className="text-sm text-gray-600">
                      {currentEntity?.masteryLevel || 0}%
                    </span>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowSkillMasteryForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learning Goals Tab */}
      {!isNewStudent && activeTab === "goals" && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Learning Goals</h2>
            <div className="flex items-center space-x-2">
              {progress.length > 0 && (
                <select
                  onChange={(e) => setSelectedProgressId(e.target.value)}
                  value={selectedProgressId || ""}
                  className="border rounded py-1 px-2 text-sm"
                >
                  <option value="">Select progress record...</option>
                  {progress.map((p) => (
                    <option key={p.id} value={p.id}>
                      Progress #{p.id.substring(0, 8)}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => {
                  if (!selectedProgressId && progress.length > 0) {
                    setSelectedProgressId(progress[0].id);
                  }
                  setCurrentEntity(null);
                  setShowLearningGoalForm(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                disabled={progress.length === 0}
              >
                Add Goal
              </button>
            </div>
          </div>

          {progress.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-yellow-700">
                You need to create a progress record first before adding
                learning goals.
              </p>
            </div>
          ) : learningGoals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Goal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {learningGoals.map((goal) => (
                    <tr key={goal.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {goal.goal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {goal.target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full"
                            style={{ width: `${goal.completion}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {goal.completion}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {goal.Due}% ({goal.due_Type})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditEntity("learningGoal", goal)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEntity("learningGoal", goal.id)
                          }
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
          ) : (
            <p className="text-gray-500">No learning goals found.</p>
          )}

          {/* Learning Goal Form Modal */}
          {showLearningGoalForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                  {currentEntity ? "Edit Learning Goal" : "Add New Goal"}
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      id: currentEntity?.id,
                      progressId: formData.get("progressId"),
                      goal: formData.get("goal"),
                      target: formData.get("target"),
                      completion: parseInt(formData.get("completion")),
                      Due: parseInt(formData.get("Due")),
                      due_Type: formData.get("due_Type"),
                    };
                    handleLearningGoalSubmit(data);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Progress Record
                    </label>
                    <select
                      name="progressId"
                      defaultValue={
                        currentEntity?.progressId || selectedProgressId || ""
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select progress record...</option>
                      {progress.map((p) => (
                        <option key={p.id} value={p.id}>
                          Progress #{p.id.substring(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Goal Description
                    </label>
                    <input
                      type="text"
                      name="goal"
                      defaultValue={currentEntity?.goal || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Target Type
                    </label>
                    <select
                      name="target"
                      defaultValue={currentEntity?.target || "WEEKLY"}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Completion (0-100%)
                    </label>
                    <input
                      type="range"
                      name="completion"
                      min="0"
                      max="100"
                      defaultValue={currentEntity?.completion || "0"}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      onChange={(e) =>
                        (document.getElementById(
                          "completionValue"
                        ).textContent = e.target.value + "%")
                      }
                    />
                    <span
                      id="completionValue"
                      className="text-sm text-gray-600"
                    >
                      {currentEntity?.completion || 0}%
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Due Progress (0-100%)
                    </label>
                    <input
                      type="range"
                      name="Due"
                      min="0"
                      max="100"
                      defaultValue={currentEntity?.Due || "0"}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      onChange={(e) =>
                        (document.getElementById("dueValue").textContent =
                          e.target.value + "%")
                      }
                    />
                    <span id="dueValue" className="text-sm text-gray-600">
                      {currentEntity?.Due || 0}%
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Due Type
                    </label>
                    <select
                      name="due_Type"
                      defaultValue={currentEntity?.due_Type || "WEEKLY"}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowLearningGoalForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {!isNewStudent && activeTab === "projects" && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Projects</h2>
            <div className="flex items-center space-x-2">
              {progress.length > 0 && (
                <select
                  onChange={(e) => setSelectedProgressId(e.target.value)}
                  value={selectedProgressId || ""}
                  className="border rounded py-1 px-2 text-sm"
                >
                  <option value="">Select progress record...</option>
                  {progress.map((p) => (
                    <option key={p.id} value={p.id}>
                      Progress #{p.id.substring(0, 8)}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => {
                  if (!selectedProgressId && progress.length > 0) {
                    setSelectedProgressId(progress[0].id);
                  }
                  setCurrentEntity(null);
                  setShowProjectForm(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                disabled={progress.length === 0}
              >
                Add Project
              </button>
            </div>
          </div>

          {progress.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-yellow-700">
                You need to create a progress record first before adding
                projects.
              </p>
            </div>
          ) : projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      View Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.projectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-purple-600 h-2.5 rounded-full"
                            style={{ width: `${project.completion}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {project.completion}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.viewLink ? (
                          <a
                            href={project.viewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Project
                          </a>
                        ) : (
                          <span className="text-gray-400">No link</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditEntity("project", project)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEntity("project", project.id)
                          }
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
          ) : (
            <p className="text-gray-500">No projects found.</p>
          )}

          {/* Project Form Modal */}
          {showProjectForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                  {currentEntity ? "Edit Project" : "Add New Project"}
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      id: currentEntity?.id,
                      progressId: formData.get("progressId"),
                      projectName: formData.get("projectName"),
                      description: formData.get("description"),
                      completion: parseInt(formData.get("completion")),
                      viewLink: formData.get("viewLink"),
                      feedback: formData.get("feedback"),
                    };
                    handleProjectSubmit(data);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Progress Record
                    </label>
                    <select
                      name="progressId"
                      defaultValue={
                        currentEntity?.progressId || selectedProgressId || ""
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select progress record...</option>
                      {progress.map((p) => (
                        <option key={p.id} value={p.id}>
                          Progress #{p.id.substring(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      defaultValue={currentEntity?.projectName || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={currentEntity?.description || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Completion (0-100%)
                    </label>
                    <input
                      type="range"
                      name="completion"
                      min="0"
                      max="100"
                      defaultValue={currentEntity?.completion || "0"}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      onChange={(e) =>
                        (document.getElementById(
                          "projectCompletionValue"
                        ).textContent = e.target.value + "%")
                      }
                    />
                    <span
                      id="projectCompletionValue"
                      className="text-sm text-gray-600"
                    >
                      {currentEntity?.completion || 0}%
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      View Link (optional)
                    </label>
                    <input
                      type="url"
                      name="viewLink"
                      defaultValue={currentEntity?.viewLink || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Feedback (optional)
                    </label>
                    <textarea
                      name="feedback"
                      defaultValue={currentEntity?.feedback || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowProjectForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificates Tab */}
      {!isNewStudent && activeTab === "certificates" && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Certificates</h2>
            <div className="flex items-center space-x-2">
              {progress.length > 0 && (
                <select
                  onChange={(e) => setSelectedProgressId(e.target.value)}
                  value={selectedProgressId || ""}
                  className="border rounded py-1 px-2 text-sm"
                >
                  <option value="">Select progress record...</option>
                  {progress.map((p) => (
                    <option key={p.id} value={p.id}>
                      Progress #{p.id.substring(0, 8)}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => {
                  if (!selectedProgressId && progress.length > 0) {
                    setSelectedProgressId(progress[0].id);
                  }
                  setCurrentEntity(null);
                  setShowCertificateForm(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                disabled={progress.length === 0}
              >
                Add Certificate
              </button>
            </div>
          </div>

          {progress.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-yellow-700">
                You need to create a progress record first before adding
                certificates.
              </p>
            </div>
          ) : certificates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Links
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.map((cert) => (
                    <tr key={cert.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cert.certificateName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cert.issueDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {cert.viewLink && (
                            <a
                              href={cert.viewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          )}
                          {cert.downloadLink && (
                            <a
                              href={cert.downloadLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditEntity("certificate", cert)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEntity("certificate", cert.id)
                          }
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
          ) : (
            <p className="text-gray-500">No certificates found.</p>
          )}

          {/* Certificate Form Modal */}
          {showCertificateForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                  {currentEntity ? "Edit Certificate" : "Add New Certificate"}
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      id: currentEntity?.id,
                      progressId: formData.get("progressId"),
                      certificateName: formData.get("certificateName"),
                      issueDate: formData.get("issueDate"),
                      viewLink: formData.get("viewLink"),
                      downloadLink: formData.get("downloadLink"),
                    };
                    handleCertificateSubmit(data);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Progress Record
                    </label>
                    <select
                      name="progressId"
                      defaultValue={
                        currentEntity?.progressId || selectedProgressId || ""
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select progress record...</option>
                      {progress.map((p) => (
                        <option key={p.id} value={p.id}>
                          Progress #{p.id.substring(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Certificate Name
                    </label>
                    <input
                      type="text"
                      name="certificateName"
                      defaultValue={currentEntity?.certificateName || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      name="issueDate"
                      defaultValue={
                        currentEntity?.issueDate ||
                        new Date().toISOString().split("T")[0]
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      View Link (optional)
                    </label>
                    <input
                      type="url"
                      name="viewLink"
                      defaultValue={currentEntity?.viewLink || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="https://example.com/view"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Download Link (optional)
                    </label>
                    <input
                      type="url"
                      name="downloadLink"
                      defaultValue={currentEntity?.downloadLink || ""}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="https://example.com/download"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCertificateForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
