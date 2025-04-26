"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiverId: "",
    content: "",
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all conversations with latest message
        const conversationsResponse = await fetch("/api/admin/conversations");

        if (!conversationsResponse.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const conversationsData = await conversationsResponse.json();
        setConversations(conversationsData);

        // Fetch all users for new message dropdown
        const usersResponse = await fetch("/api/admin/users");

        if (!usersResponse.ok) {
          throw new Error("Failed to fetch users");
        }

        const usersData = await usersResponse.json();
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNewMessageChange = (e) => {
    const { name, value } = e.target;
    setNewMessage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.receiverId || !newMessage.content.trim()) {
      alert("Please select a recipient and enter a message");
      return;
    }

    try {
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Reset form
      setNewMessage({ receiverId: "", content: "" });
      setShowNewMessageForm(false);

      // Redirect to the conversation
      router.push(`/admin/messages/${data.conversationId}`);
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err.message);
    }
  };

  const handleDeleteConversation = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this conversation? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/conversations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      // Remove from state
      setConversations(conversations.filter((conv) => conv.id !== id));
    } catch (err) {
      console.error("Error deleting conversation:", err);
      alert(err.message);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          <button
            onClick={() => setShowNewMessageForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            New Message
          </button>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          onClick={() => setShowNewMessageForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          New Message
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-md text-red-800">
          <h3 className="text-lg font-semibold mb-2">
            Error loading conversations
          </h3>
          <p>{error}</p>
          <button
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white p-6 rounded-md shadow text-center">
          <p className="text-gray-500">
            No conversations found. Start a new one!
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="hover:bg-gray-50">
                <Link href={`/admin/messages/${conversation.id}`}>
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {conversation.participants.map((participant) => (
                            <div
                              key={participant.id}
                              className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"
                            >
                              {participant.image ? (
                                <img
                                  src={participant.image}
                                  alt={`${participant.firstName} ${participant.lastName}`}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <span className="text-lg font-medium text-gray-700">
                                  {participant.firstName.charAt(0)}
                                  {participant.lastName.charAt(0)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="ml-4 truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.participants
                              .map((p) => `${p.firstName} ${p.lastName}`)
                              .join(", ")}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.latestMessage?.content ||
                              "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-5 flex flex-col items-end">
                      <p className="text-xs text-gray-500">
                        {conversation.latestMessage
                          ? getTimeAgo(conversation.latestMessage.sentAt)
                          : ""}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Prevent navigation
                        handleDeleteConversation(conversation.id);
                      }}
                      className="ml-4 text-red-600 hover:text-red-800"
                      aria-label="Delete conversation"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* New message modal */}
      {showNewMessageForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">New Message</h3>
              <button
                onClick={() => setShowNewMessageForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSendMessage}>
              <div className="mb-4">
                <label
                  htmlFor="receiverId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Recipient
                </label>
                <select
                  id="receiverId"
                  name="receiverId"
                  value={newMessage.receiverId}
                  onChange={handleNewMessageChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Recipient</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  value={newMessage.content}
                  onChange={handleNewMessageChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Type your message here..."
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewMessageForm(false)}
                  className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
