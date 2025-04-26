import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AssignmentsPage from "@/app/dashboard/assignments/page";
import "@testing-library/jest-dom";

// Mock fetch
global.fetch = jest.fn();

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Assignments Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAssignments = [
    {
      id: "1",
      title: "React Component Library",
      description: "Create a reusable component library",
      dueDate: "2023-12-31",
      status: "PENDING",
      mentor: {
        user: {
          firstName: "Emma",
          lastName: "Wilson",
          image: null,
        },
      },
    },
    {
      id: "2",
      title: "JavaScript Algorithms",
      description: "Implement algorithms in JavaScript",
      dueDate: "2023-11-15",
      submittedAt: "2023-11-10",
      status: "COMPLETED",
      grade: "A",
      feedback: "Excellent work!",
      mentor: {
        user: {
          firstName: "Alex",
          lastName: "Rivera",
          image: null,
        },
      },
      files: ["https://github.com/student/algorithms"],
    },
  ];

  test("shows loading state and then displays assignments", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assignments: mockAssignments }),
    });

    render(<AssignmentsPage />);

    // Check loading state
    expect(screen.getByText("Loading assignments...")).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("React Component Library")).toBeInTheDocument();
    });

    // Check if assignments are displayed
    expect(screen.getByText("React Component Library")).toBeInTheDocument();
    expect(screen.getByText("Emma Wilson")).toBeInTheDocument();
  });

  test("handles API error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AssignmentsPage />);

    // Wait for error state
    await waitFor(() => {
      expect(
        screen.getByText("Failed to load assignments. Please try again.")
      ).toBeInTheDocument();
    });

    // Check for retry button
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  test("shows empty state when no assignments are available", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assignments: [] }),
    });

    render(<AssignmentsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("No pending assignments")).toBeInTheDocument();
    });
  });
});
