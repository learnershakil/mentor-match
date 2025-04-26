import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { SessionCard } from "@/components/sessions/session-card";

// Mock next-auth
jest.mock("next-auth/react");

describe("SessionCard Reschedule Button", () => {
  const mockUseSession = useSession as jest.Mock;

  beforeEach(() => {
    mockUseSession.mockReset();
  });

  const mockSession = {
    id: "123",
    title: "React Components",
    description: "Learn about React components",
    startTime: new Date("2025-05-01T10:00:00Z"),
    endTime: new Date("2025-05-01T11:00:00Z"),
    status: "SCHEDULED",
    joinUrl: "https://meet.example.com/123",
    mentor: {
      name: "Jane Mentor",
      image: "/avatar.jpg",
    },
    student: {
      name: "John Student",
      image: "/avatar.jpg",
    },
  };

  test("Reschedule button is visible for mentors", () => {
    // Mock mentor session
    mockUseSession.mockReturnValue({
      data: { user: { role: "MENTOR" } },
      status: "authenticated",
    });

    render(<SessionCard session={mockSession} userRole="MENTOR" />);

    // Button should be visible for mentors
    expect(
      screen.getByRole("button", { name: /Reschedule/i })
    ).toBeInTheDocument();
  });

  test("Reschedule button is NOT visible for students", () => {
    // Mock student session
    mockUseSession.mockReturnValue({
      data: { user: { role: "STUDENT" } },
      status: "authenticated",
    });

    render(<SessionCard session={mockSession} userRole="STUDENT" />);

    // Button should not be visible for students
    expect(
      screen.queryByRole("button", { name: /Reschedule/i })
    ).not.toBeInTheDocument();
  });

  test("Reschedule button is only shown for upcoming sessions", () => {
    // Mock mentor session
    mockUseSession.mockReturnValue({
      data: { user: { role: "MENTOR" } },
      status: "authenticated",
    });

    // For completed session
    const completedSession = {
      ...mockSession,
      status: "COMPLETED",
    };

    render(<SessionCard session={completedSession} userRole="MENTOR" />);

    // Button should not be visible for completed sessions
    expect(
      screen.queryByRole("button", { name: /Reschedule/i })
    ).not.toBeInTheDocument();
  });
});
