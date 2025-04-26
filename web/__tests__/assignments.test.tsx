import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
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

describe("AssignmentCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAssignment = {
    id: "1",
    title: "React Component Library",
    description:
      "Create a reusable component library with at least 5 components",
    dueDate: "2023-12-31",
    mentor: {
      name: "Emma Wilson",
      image: "/placeholder.svg",
    },
    status: "pending",
  };

  const mockCompletedAssignment = {
    id: "2",
    title: "JavaScript Algorithms",
    description: "Implement common algorithms in JavaScript",
    dueDate: "2023-11-15",
    submittedDate: "2023-11-10",
    mentor: {
      name: "Alex Rivera",
      image: "/placeholder.svg",
    },
    status: "completed",
    grade: "A",
    feedback: "Excellent work!",
    files: ["https://github.com/student/algorithms"],
  };

  test("renders pending assignment correctly", () => {
    render(<AssignmentCard assignment={mockAssignment} />);

    expect(screen.getByText("React Component Library")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create a reusable component library with at least 5 components"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Emma Wilson")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Submit Assignment")).toBeInTheDocument();
  });

  test("renders completed assignment correctly", () => {
    render(<AssignmentCard assignment={mockCompletedAssignment} />);

    expect(screen.getByText("JavaScript Algorithms")).toBeInTheDocument();
    expect(
      screen.getByText("Implement common algorithms in JavaScript")
    ).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("View Submission")).toBeInTheDocument();
  });

  test("opens submit dialog when submit button is clicked", async () => {
    render(<AssignmentCard assignment={mockAssignment} />);

    const submitButton = screen.getByText("Submit Assignment");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Submit your completed assignment/i)
      ).toBeInTheDocument();
    });
  });

  test("submits assignment successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const refreshMock = jest.fn();
    render(
      <AssignmentCard assignment={mockAssignment} onRefresh={refreshMock} />
    );

    // Open submission dialog
    fireEvent.click(screen.getByText("Submit Assignment"));

    // Add a file URL
    const fileInput = screen.getByPlaceholderText(/github.com/i);
    fireEvent.change(fileInput, {
      target: { value: "https://github.com/student/project" },
    });
    fireEvent.click(screen.getByText("Add"));

    // Submit the form
    fireEvent.click(screen.getByText("Submit Assignment").closest("button")!);

    await waitFor(() => {
      // Check if API was called correctly
      expect(global.fetch).toHaveBeenCalledWith("/api/assignments/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: ["https://github.com/student/project"],
          Comments: "",
          status: "SUBMITTED",
        }),
      });

      // Check if success toast was shown
      expect(toast.success).toHaveBeenCalledWith(
        "Assignment submitted successfully!"
      );

      // Check if refresh callback was called
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  test("handles submission errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Submission failed" }),
    });

    render(<AssignmentCard assignment={mockAssignment} />);

    // Open submission dialog
    fireEvent.click(screen.getByText("Submit Assignment"));

    // Add a file URL
    const fileInput = screen.getByPlaceholderText(/github.com/i);
    fireEvent.change(fileInput, {
      target: { value: "https://github.com/student/project" },
    });
    fireEvent.click(screen.getByText("Add"));

    // Submit the form
    fireEvent.click(screen.getByText("Submit Assignment").closest("button")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Submission failed");
    });
  });

  test("shows validation error if no files are provided", async () => {
    render(<AssignmentCard assignment={mockAssignment} />);

    // Open submission dialog
    fireEvent.click(screen.getByText("Submit Assignment"));

    // Submit without adding any files
    fireEvent.click(screen.getByText("Submit Assignment").closest("button")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please provide at least one file URL"
      );
    });

    // Make sure API wasn't called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("view submission dialog shows correct information", async () => {
    render(<AssignmentCard assignment={mockCompletedAssignment} />);

    // Open view dialog
    fireEvent.click(screen.getByText("View Submission"));

    await waitFor(() => {
      // Check dialog content
      expect(screen.getByText("Assignment Submission")).toBeInTheDocument();
      expect(
        screen.getByText("Details for JavaScript Algorithms")
      ).toBeInTheDocument();
      expect(screen.getByText("Excellent work!")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();

      // Check if the submission file link is shown
      const fileLink = screen.getByText(
        "https://github.com/student/algorithms"
      );
      expect(fileLink).toBeInTheDocument();
      expect(fileLink.getAttribute("href")).toBe(
        "https://github.com/student/algorithms"
      );
    });
  });
});
