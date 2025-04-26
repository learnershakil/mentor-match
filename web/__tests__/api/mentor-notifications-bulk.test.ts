import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { POST } from "@/app/api/mentor/notifications/bulk/route";

describe("POST /api/mentor/notifications/bulk", () => {
  const prismaMock = getPrismaMock();

  beforeEach(() => {
    // Set up authenticated mentor session
    mockAuthSession("MENTOR");

    // Mock finding students
    prismaMock.student.findMany.mockResolvedValue([
      {
        id: "student1",
        user: { id: "user1" },
      },
      {
        id: "student2",
        user: { id: "user2" },
      },
    ] as any);

    // Mock creating notifications
    prismaMock.notification.create.mockResolvedValue({
      id: "notification1",
      userId: "user1",
      title: "Test Notification",
      content: "This is a test notification",
      type: "SESSION",
      isRead: false,
      createdAt: new Date(),
    } as any);
  });

  test("should send notifications to multiple students", async () => {
    const requestBody = {
      studentIds: ["student1", "student2"],
      title: "Test Notification",
      content: "This is a test notification",
      type: "SESSION",
    };

    const request = mockNextRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.count).toBe(2);
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);

    // Check first notification
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user1",
          title: "Test Notification",
          content: "This is a test notification",
          type: "SESSION",
        }),
      })
    );

    // Check second notification
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user2",
          title: "Test Notification",
          content: "This is a test notification",
          type: "SESSION",
        }),
      })
    );
  });

  test("should require mentor role", async () => {
    // Mock student session
    mockAuthSession("STUDENT");

    const requestBody = {
      studentIds: ["student1", "student2"],
      title: "Test Notification",
      content: "This is a test notification",
      type: "SESSION",
    };

    const request = mockNextRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Only mentors can send notifications");
  });

  test("should validate input data", async () => {
    // Missing student IDs
    const requestBody = {
      title: "Test Notification",
      content: "This is a test notification",
      type: "SESSION",
    };

    const request = mockNextRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Student IDs are required and must be an array");
  });
});
