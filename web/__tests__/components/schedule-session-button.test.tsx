import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { ScheduleSessionButton } from "@/components/sessions/schedule-session-button";

// Mock next-auth
jest.mock("next-auth/react");

describe("ScheduleSessionButton", () => {
  const mockUseSession = useSession as jest.Mock;

  beforeEach(() => {
    mockUseSession.mockReset();
  });

  test("renders correctly for MENTOR users", () => {
    // Mock mentor session
    mockUseSession.mockReturnValue({
      data: { user: { role: "MENTOR" } },
      status: "authenticated",
    });

    render(<ScheduleSessionButton />);

    // Button should be visible for mentors
    expect(
      screen.getByRole("button", { name: /Schedule Session/i })
    ).toBeInTheDocument();
  });

  test("does not render for STUDENT users", () => {
    // Mock student session
    mockUseSession.mockReturnValue({
      data: { user: { role: "STUDENT" } },
      status: "authenticated",
    });

    render(<ScheduleSessionButton />);

    // Button should not be visible for students
    expect(
      screen.queryByRole("button", { name: /Schedule Session/i })
    ).not.toBeInTheDocument();
  });

  test("does not render for unauthenticated users", () => {
    // Mock unauthenticated session
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<ScheduleSessionButton />);

    // Button should not be visible for unauthenticated users
    expect(
      screen.queryByRole("button", { name: /Schedule Session/i })
    ).not.toBeInTheDocument();
  });

  test("accepts custom label and icon settings", () => {
    // Mock mentor session
    mockUseSession.mockReturnValue({
      data: { user: { role: "MENTOR" } },
      status: "authenticated",
    });

    render(<ScheduleSessionButton label="Custom Label" showIcon={false} />);

    // Should use custom label
    expect(
      screen.getByRole("button", { name: /Custom Label/i })
    ).toBeInTheDocument();
    // Should not have the icon when showIcon is false
    expect(screen.queryByTestId("plus-icon")).not.toBeInTheDocument();
  });
});
