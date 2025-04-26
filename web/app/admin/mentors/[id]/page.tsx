"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIME_SLOTS = [
  "08:00-10:00",
  "10:00-12:00",
  "12:00-14:00",
  "14:00-16:00",
  "16:00-18:00",
  "18:00-20:00",
  "20:00-22:00",
];
const INTERESTS = ["WebDevelopment", "AiMl", "AppDevelopment", "CyberSecurity"];

export default function MentorEditPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const isNewMentor = id === "new";

  const [mentor, setMentor] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(!isNewMentor);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [availabilitySchedule, setAvailabilitySchedule] = useState({});
  const [createNewUser, setCreateNewUser] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // Form data for mentor
  const [formData, setFormData] = useState({
    userId: "",
    specialties: [],
    company: "",
    jobTitle: "",
    experience: "",
    rating: 0,
    reviewCount: 0,
    availability: null,
  });

  // Form data for user (when creating a new user)
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "MENTOR",
    intrest: "WebDevelopment",
    bio: "",
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // If creating a new mentor, fetch available users
        if (isNewMentor) {
          const response = await fetch("/api/admin/users-without-mentor", {
            cache: "no-store",
          });
          if (!response.ok) {
            throw new Error("Failed to fetch available users");
          }
          const users = await response.json();
          setAvailableUsers(users);

          // Initialize empty availability schedule
          const initialAvailability = {};
          DAYS_OF_WEEK.forEach((day) => {
            initialAvailability[day] = {};
            TIME_SLOTS.forEach((slot) => {
              initialAvailability[day][slot] = false;
            });
          });
          setAvailabilitySchedule(initialAvailability);

          setIsLoading(false);
        } else {
          // If editing, fetch the mentor details
          const response = await fetch(`/api/admin/mentors/${id}`, {
            cache: "no-store",
          });
          if (!response.ok) {
            throw new Error("Failed to fetch mentor");
          }

          const mentorData = await response.json();
          setMentor(mentorData);

          // Populate form with mentor data
          setFormData({
            userId: mentorData.userId,
            specialties: mentorData.specialties || [],
            company: mentorData.company || "",
            jobTitle: mentorData.jobTitle || "",
            experience: mentorData.experience || "",
            rating: mentorData.rating || 0,
            reviewCount: mentorData.reviewCount || 0,
            availability: mentorData.availability || null,
          });

          // Set the image preview if available
          if (mentorData.user?.image) {
            setImagePreview(mentorData.user.image);
          }

          // Initialize availability schedule from mentor data
          if (mentorData.availability) {
            // Make sure we have a complete schedule with all days and slots
            const completeSchedule = {};
            DAYS_OF_WEEK.forEach((day) => {
              completeSchedule[day] = {};
              TIME_SLOTS.forEach((slot) => {
                completeSchedule[day][slot] =
                  mentorData.availability[day]?.[slot] || false;
              });
            });
            setAvailabilitySchedule(completeSchedule);
          } else {
            // Create empty schedule
            const initialAvailability = {};
            DAYS_OF_WEEK.forEach((day) => {
              initialAvailability[day] = {};
              TIME_SLOTS.forEach((slot) => {
                initialAvailability[day][slot] = false;
              });
            });
            setAvailabilitySchedule(initialAvailability);
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isNewMentor]);

  // Handle form changes for mentor data
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  // Handle form changes for user data
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle specialty changes
  const addSpecialty = () => {
    if (newSpecialty.trim() !== "") {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()],
      }));
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (index) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  // Handle availability changes
  const toggleAvailability = (day, timeSlot) => {
    setAvailabilitySchedule((prev) => {
      const newSchedule = { ...prev };
      newSchedule[day][timeSlot] = !newSchedule[day][timeSlot];
      return newSchedule;
    });
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      let userId = formData.userId;
      let userImageUrl = null;

      // Handle image upload first if we have an image file
      if (imageFile) {
        // Create a FormData object to send the file
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);

        const uploadResponse = await fetch("/api/admin/upload-image", {
          method: "POST",
          body: imageFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const imageData = await uploadResponse.json();
        userImageUrl = imageData.imageUrl;
      }

      // If creating a new user
      if (isNewMentor && createNewUser) {
        // Create user first with image if provided
        const userDataToSend = {
          ...userData,
          image: userImageUrl, // Add the image URL if uploaded
        };

        const userResponse = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userDataToSend),
        });

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.error || "Failed to create user");
        }

        const createdUser = await userResponse.json();
        userId = createdUser.id;
      } else if (!isNewMentor && userImageUrl) {
        // Update existing user's image if we're editing and have a new image
        await fetch(`/api/admin/users/${formData.userId}/update-image`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: userImageUrl }),
        });
      }

      // Prepare form data with availability - ensure it's properly structured
      const dataToSubmit = {
        ...formData,
        userId: userId, // Use the new user ID if we created one
        // Directly send the availability object - PostgreSQL JSON type will handle it
        availability: availabilitySchedule,
      };

      console.log(
        "Submitting availability data:",
        JSON.stringify(availabilitySchedule, null, 2)
      );

      // For new mentors
      if (isNewMentor) {
        const response = await fetch("/api/admin/mentors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSubmit),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create mentor");
        }
      }
      // For editing existing mentors
      else {
        const response = await fetch(`/api/admin/mentors/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSubmit),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update mentor");
        }
      }

      router.push("/admin/mentors");
      router.refresh();
    } catch (err) {
      console.error("Error saving mentor:", err);
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
          {isNewMentor ? "Add New Mentor" : "Edit Mentor"}
        </h1>
        <Link
          href="/admin/mentors"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back to Mentors
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
        encType="multipart/form-data"
      >
        {isNewMentor && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-bold">User Information</h2>
              <div className="ml-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-indigo-600"
                    checked={createNewUser}
                    onChange={() => setCreateNewUser(!createNewUser)}
                  />
                  <span className="ml-2 text-gray-700">Create new user</span>
                </label>
              </div>
            </div>

            {createNewUser ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="firstName"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleUserChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="lastName"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleUserChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="email"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleUserChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="password"
                  >
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={userData.password}
                    onChange={handleUserChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="phone"
                  >
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={userData.phone}
                    onChange={handleUserChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="intrest"
                  >
                    Interest *
                  </label>
                  <select
                    id="intrest"
                    name="intrest"
                    value={userData.intrest}
                    onChange={handleUserChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    {INTERESTS.map((interest) => (
                      <option key={interest} value={interest}>
                        {interest}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 md:col-span-2">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="bio"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={userData.bio}
                    onChange={handleUserChange}
                    rows={3}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  ></textarea>
                </div>

                {/* Add image upload field */}
                <div className="mb-4 md:col-span-2">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="image"
                  >
                    Profile Image
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    {imagePreview && (
                      <div className="ml-4">
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="h-16 w-16 object-cover rounded-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="userId"
                >
                  Select User *
                </label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                    No available users. Please create a new user.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* If editing a mentor, show the image upload field */}
        {!isNewMentor && (
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="image"
            >
              Profile Image
            </label>
            <div className="flex items-center">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {(imagePreview || mentor?.user?.image) && (
                <div className="ml-4">
                  <img
                    src={imagePreview || mentor?.user?.image}
                    alt="Profile preview"
                    className="h-16 w-16 object-cover rounded-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold mb-4">Mentor Profile</h2>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="specialties"
          >
            Specialties
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.specialties.map((specialty, index) => (
              <div
                key={index}
                className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center"
              >
                <span>{specialty}</span>
                <button
                  type="button"
                  onClick={() => removeSpecialty(index)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="Add a specialty"
              className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              type="button"
              onClick={addSpecialty}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
            >
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="jobTitle"
            >
              Job Title
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle || ""}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="company"
            >
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company || ""}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="experience"
            >
              Years of Experience
            </label>
            <input
              type="number"
              id="experience"
              name="experience"
              min="0"
              max="100"
              value={formData.experience || ""}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="rating"
            >
              Rating (0-5)
            </label>
            <input
              type="number"
              id="rating"
              name="rating"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="reviewCount"
            >
              Number of Reviews
            </label>
            <input
              type="number"
              id="reviewCount"
              name="reviewCount"
              min="0"
              value={formData.reviewCount}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        {/* Availability Schedule */}
        {/* <div className="mt-6 mb-4">
          <h3 className="text-lg font-bold mb-3">Availability Schedule</h3>
          <p className="text-sm text-gray-600 mb-2">
            Check the time slots when the mentor is available
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-sm">
                    Day/Time
                  </th>
                  {TIME_SLOTS.map((slot) => (
                    <th
                      key={slot}
                      className="py-2 px-4 border-b border-gray-200 text-center text-sm"
                    >
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-200 font-medium">
                      {day}
                    </td>
                    {TIME_SLOTS.map((slot) => {
                      const isAvailable =
                        availabilitySchedule[day]?.[slot] || false;
                      return (
                        <td
                          key={`${day}-${slot}`}
                          className="py-2 px-4 border-b border-gray-200 text-center"
                          onClick={() => toggleAvailability(day, slot)}
                        >
                          <div
                            className={`w-6 h-6 mx-auto flex items-center justify-center rounded ${
                              isAvailable ? "bg-green-100" : "bg-gray-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isAvailable}
                              onChange={() => {}} // Handled by parent div onClick
                              className="form-checkbox h-4 w-4 text-green-600 cursor-pointer"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-green-600 mt-2">
            {Object.values(availabilitySchedule).some((day) =>
              Object.values(day).some((slot) => slot === true)
            )
              ? "✓ Availability schedule updated"
              : "Please select your available time slots"}
          </p>
        </div> */}

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={
              isSaving || (isNewMentor && !createNewUser && !formData.userId)
            }
            className={`px-4 py-2 ${
              isSaving || (isNewMentor && !createNewUser && !formData.userId)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded-md`}
          >
            {isSaving ? "Saving..." : "Save Mentor"}
          </button>
        </div>
      </form>
    </div>
  );
}
