import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { CreateAssignmentDialog } from "@/components/assignments/create-assignment-dialog";
import "@testing-library/jest-dom";

// Mock router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
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

describe("CreateAssignmentDialog", () => {
  const mockStudents = [
    {
      id: "student1",
      name: "John Doe",
    },
    {
      id: "student2",
      name: "Jane Smith",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful fetch for students
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ students: mockStudents }),
    });
  });

  it("renders the create assignment dialog when triggered", async () => {
    render(
      <CreateAssignmentDialog>
        <button>Create Assignment</button>
      </CreateAssignmentDialog>
    );

    // Click to open the dialog
    fireEvent.click(screen.getByText("Create Assignment"));

    // Check if dialog is opened
    await waitFor(() => {
      expect(
        screen.getByText("Create a new assignment for your student")
      ).toBeInTheDocument();
    });
  });

  it("fetches students when opened", async () => {
    render(
      <CreateAssignmentDialog>
        <button>Create Assignment</button>
      </CreateAssignmentDialog>
    );

    // Click to open the dialog
    fireEvent.click(screen.getByText("Create Assignment"));

    // Wait for the fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/assignments/students");
    });

    // Wait for students to load
    await waitFor(() => {
      expect(screen.getByText("Select a student")).toBeInTheDocument();
    });
  });

  it("validates form inputs before submission", async () => {
    render(
      <CreateAssignmentDialog>
        <button>Create Assignment</button>
      </CreateAssignmentDialog>
    );

    // Click to open the dialog
    fireEvent.click(screen.getByText("Create Assignment"));

    // Wait for dialog to open
    await waitFor(() => {
      expect(
        screen.getByText("Create a new assignment for your student")
      ).toBeInTheDocument();
    });

    // Click submit without filling form
    fireEvent.click(
      screen.getByText("Create Assignment", {
        selector: 'button[type="submit"]',
      })
    );

    // Check for validation errors
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please enter an assignment title"
      );
    });
  });

  it("submits form successfully", async () => {
    // Mock successful create assignment API call
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/assignments/students") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ students: mockStudents }),
        });
      } else if (url === "/api/assignments") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "new-assignment-id" }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    const onCreatedMock = jest.fn();

    render(
      <CreateAssignmentDialog onAssignmentCreated={onCreatedMock}>
        <button>Create Assignment</button>
      </CreateAssignmentDialog>
    );

    // Click to open the dialog
    fireEvent.click(screen.getByText("Create Assignment"));

    // Wait for dialog to open
    await waitFor(() => {
      expect(
        screen.getByText("Create a new assignment for your student")
      ).toBeInTheDocument();
    });

    // Fill the form
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New Test Assignment" },
    });

    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "This is a test assignment" },
    });

    // Select student - this is a bit tricky with Select component, might need adjustment
    const studentSelect = screen.getByText("Select a student");
    fireEvent.click(studentSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText("John Doe"));
    });

    // Select due date - this will depend on how your date picker works
    const dateButton = screen.getByRole("button", { name: /select a date/i });
    fireEvent.click(dateButton);

    // Choose a date from the calendar (simplified)
    const anyFutureDate = screen.getByRole("button", { name: /\d+/ });
    fireEvent.click(anyFutureDate);

    // Submit the form
    fireEvent.click(
      screen.getByText("Create Assignment", {
        selector: 'button[type="submit"]',
      })
    );

    // Check if API was called correctly
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/assignments",
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Assignment created successfully"
      );
      expect(onCreatedMock).toHaveBeenCalled();
    });
  });

  it("handles API errors during creation", async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/assignments/students") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ students: mockStudents }),
        });
      } else if (url === "/api/assignments") {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Failed to create assignment" }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(
      <CreateAssignmentDialog>
        <button>Create Assignment</button>
      </CreateAssignmentDialog>
    );

    // Open dialog and fill the required fields (simplified from previous test)
    fireEvent.click(screen.getByText("Create Assignment"));

    await waitFor(() => {
      expect(screen.getByLabelText("Title")).toBeInTheDocument();
    });

    // Fill form with minimum required fields
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Test Assignment" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Test description" },
    });

    // Simplified student selection - adjust as needed
    const studentSelect = screen.getByText("Select a student");
    fireEvent.click(studentSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText("John Doe"));
    });

    // Simplified date selection - adjust as needed
    const dateButton = screen.getByRole("button", { name: /select a date/i });
    fireEvent.click(dateButton);
    const anyFutureDate = screen.getByRole("button", { name: /\d+/ });
    fireEvent.click(anyFutureDate);

    // Submit and check for error
    fireEvent.click(
      screen.getByText("Create Assignment", {
        selector: 'button[type="submit"]',
      })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to create assignment");
    });
  });
});
