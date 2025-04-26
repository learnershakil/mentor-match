import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import MentorAssignmentsPage from "@/app/mentor-dashboard/assignments/page";
import "@testing-library/jest-dom";

// Mock router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("MentorAssignmentsPage", () => {
  const mockAssignments = [
    {
      id: "1",
      title: "React Components",
      description: "Create custom React components",
      dueDate: "2023-12-31",
      student: {
        id: "student1",
        user: {
          firstName: "John",
          lastName: "Doe",
          image: null,
        },
      },
      status: "SUBMITTED",
    },
    {
      id: "2",
      title: "API Integration",
      description: "Integrate with external APIs",
      dueDate: "2023-12-15",
      student: {
        id: "student2",
        user: {
          firstName: "Jane",
          lastName: "Smith",
          image: null,
        },
      },
      status: "PENDING",
    },
  ];

  const mockStudents = [
    {
      id: "student1",
      user: {
        firstName: "John",
        lastName: "Doe",
        image: null,
      },
      learningInterests: ["WebDevelopment"],
    },
    {
      id: "student2",
      user: {
        firstName: "Jane",
        lastName: "Smith",
        image: null,
      },
      learningInterests: ["WebDevelopment"],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the fetch calls
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/assignments?")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assignments: mockAssignments }),
        });
      } else if (url.includes("/api/mentor/students")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ students: mockStudents }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  it("loads and displays assignments", async () => {
    render(<MentorAssignmentsPage />);

    // Initially shows loading state
    expect(screen.getByText("Loading assignments...")).toBeInTheDocument();

    // Wait for assignments to load
    await waitFor(() => {
      expect(screen.getByText("React Components")).toBeInTheDocument();
    });

    // Check if both assignments are displayed
    expect(screen.getByText("API Integration")).toBeInTheDocument();
  });

  it("shows empty state when no assignments are available", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/assignments?")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assignments: [] }),
        });
      } else if (url.includes("/api/mentor/students")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ students: mockStudents }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(<MentorAssignmentsPage />);

    // Wait for empty state to show
    await waitFor(() => {
      expect(screen.getByText(/No assignments to grade/i)).toBeInTheDocument();
    });
  });

  it("handles API error", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/assignments?")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(<MentorAssignmentsPage />);

    // Wait for error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load assignments");
    });
  });

  it("filters assignments based on search query", async () => {
    render(<MentorAssignmentsPage />);

    // Wait for assignments to load
    await waitFor(() => {
      expect(screen.getByText("React Components")).toBeInTheDocument();
    });

    // Enter search query
    const searchInput = screen.getByPlaceholderText("Search assignments...");
    fireEvent.change(searchInput, { target: { value: "React" } });

    // Check that only matching assignments are displayed
    expect(screen.getByText("React Components")).toBeInTheDocument();
    expect(screen.queryByText("API Integration")).not.toBeInTheDocument();
  });

  it("handles tab switching correctly", async () => {
    render(<MentorAssignmentsPage />);

    // Wait for assignments to load
    await waitFor(() => {
      expect(screen.getByText("React Components")).toBeInTheDocument();
    });

    // Click on "Pending" tab
    fireEvent.click(screen.getByRole("tab", { name: /Pending/i }));

    // Verify fetch was called with correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=PENDING")
      );
    });
  });

  it("deletes an assignment when confirmed", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/assignments?")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assignments: mockAssignments }),
        });
      } else if (url.includes("/api/mentor/students")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ students: mockStudents }),
        });
      } else if (url.includes("/api/assignments/") && url.includes("DELETE")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(<MentorAssignmentsPage />);

    // Wait for assignments to load and go to pending tab
    await waitFor(() => {
      expect(screen.getByText("React Components")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: /Pending/i }));

    // Wait for the pending tab content to load
    await waitFor(() => {
      expect(screen.getByText("API Integration")).toBeInTheDocument();
    });

    // Find the delete button (this might need to be adjusted based on your actual UI)
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    // Wait for confirmation dialog and confirm
    await waitFor(() => {
      const confirmButton = screen.getByText("Delete", {
        selector: 'button[class*="bg-destructive"]',
      });
      fireEvent.click(confirmButton);
    });

    // Verify success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Assignment deleted successfully"
      );
    });
  });
});
