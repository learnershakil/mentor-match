import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { GET, POST } from "@/app/api/notifications/route";
import {
  GET as GetSingleNotification,
  PUT,
  DELETE,
} from "@/app/api/notifications/[id]/route";
import { POST as MarkAllRead } from "@/app/api/notifications/mark-all-read/route";
import { GET as GetUnreadCount } from "@/app/api/notifications/unread/route";

describe("Notifications API", () => {
  const prismaMock = getPrismaMock();

  // Mock notifications
  const mockNotifications = [
    {
      id: "notif1",
      userId: "user123",
      title: "New Assignment",
      content: "You have a new assignment",
      type: "ASSIGNMENT",
      isRead: false,
      createdAt: new Date("2025-05-01"),
    },
    {
      id: "notif2",
      userId: "user123",
      title: "Session Reminder",
      content: "Your session starts in 30 minutes",
      type: "SESSION",
      isRead: true,
      createdAt: new Date("2025-04-29"),
    },
    {
      id: "notif3",
      userId: "user456", // Different user
      title: "Message Received",
      content: "You have a new message",
      type: "MESSAGE",
      isRead: false,
      createdAt: new Date("2025-04-28"),
    },
  ];

  beforeEach(() => {
    // Set up authenticated user session
    mockAuthSession("STUDENT");

    // Mock notifications retrieval
    prismaMock.notification.findMany.mockResolvedValue([
      mockNotifications[0],
      mockNotifications[1],
    ]);
    prismaMock.notification.count.mockResolvedValue(2);

    // Mock single notification retrieval
    prismaMock.notification.findUnique.mockResolvedValue(mockNotifications[0]);

    // Mock unread count
    prismaMock.notification.count.mockResolvedValue(1); // 1 unread notification
  });

  describe("GET /api/notifications", () => {
    test("should return user notifications", async () => {
      const request = mockNextRequest({});
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("notifications");
      expect(data).toHaveProperty("pagination");
      expect(data.notifications).toHaveLength(2);
    });

    test("should filter by unread status", async () => {
      const request = mockNextRequest({});
      // Mock URL with search params
      Object.defineProperty(request, "url", {
        value: "http://localhost:3000/api/notifications?unread=true",
      });

      // Mock filtered notifications
      prismaMock.notification.findMany.mockResolvedValueOnce([
        mockNotifications[0],
      ]);
      prismaMock.notification.count.mockResolvedValueOnce(1);

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.notifications).toHaveLength(1);
      expect(data.notifications[0].isRead).toBe(false);
    });

    test("should filter by notification type", async () => {
      const request = mockNextRequest({});
      // Mock URL with search params
      Object.defineProperty(request, "url", {
        value: "http://localhost:3000/api/notifications?type=SESSION",
      });

      // Mock filtered notifications
      prismaMock.notification.findMany.mockResolvedValueOnce([
        mockNotifications[1],
      ]);
      prismaMock.notification.count.mockResolvedValueOnce(1);

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.notifications).toHaveLength(1);
      expect(data.notifications[0].type).toBe("SESSION");
    });
  });

  describe("POST /api/notifications", () => {
    const newNotification = {
      title: "New Notification",
      content: "This is a test notification",
      type: "SYSTEM",
    };

    test("should create a notification for self", async () => {
      // Mock notification creation
      prismaMock.notification.create.mockResolvedValue({
        id: "notif4",
        userId: "user123",
        ...newNotification,
        isRead: false,
        createdAt: new Date(),
      });

      const request = mockNextRequest(newNotification);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("id", "notif4");
      expect(data).toHaveProperty("title", newNotification.title);
    });

    test("should validate required fields", async () => {
      const invalidData = {
        title: "Missing Fields",
        // Missing content, type
      };

      const request = mockNextRequest(invalidData);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    test("should validate notification type", async () => {
      const invalidData = {
        ...newNotification,
        type: "INVALID_TYPE",
      };

      const request = mockNextRequest(invalidData);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid notification type");
    });

    test("should prevent creating notifications for others unless admin", async () => {
      const notificationForOther = {
        ...newNotification,
        userId: "user456", // Different user
      };

      const request = mockNextRequest(notificationForOther);
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("Not authorized");

      // Test that admins can create for others
      mockAuthSession("ADMIN");

      const adminRequest = mockNextRequest(notificationForOther);
      const adminResponse = await POST(adminRequest);

      expect(adminResponse.status).toBe(201);
    });
  });

  describe("GET /api/notifications/[id]", () => {
    test("should get a single notification", async () => {
      const params = { id: "notif1" };
      const request = mockNextRequest({});

      const response = await GetSingleNotification(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("id", "notif1");
      expect(data).toHaveProperty("title", "New Assignment");
    });

    test("should return 404 if notification not found", async () => {
      // Mock notification not found
      prismaMock.notification.findUnique.mockResolvedValueOnce(null);

      const params = { id: "nonexistent" };
      const request = mockNextRequest({});

      const response = await GetSingleNotification(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Notification not found");
    });

    test("should verify user owns the notification", async () => {
      // Mock notification from a different user
      prismaMock.notification.findUnique.mockResolvedValueOnce(
        mockNotifications[2]
      );

      const params = { id: "notif3" };
      const request = mockNextRequest({});

      const response = await GetSingleNotification(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Access denied");
    });
  });

  describe("PUT /api/notifications/[id]", () => {
    test("should mark notification as read", async () => {
      // Mock successful update
      prismaMock.notification.update.mockResolvedValue({
        ...mockNotifications[0],
        isRead: true,
      });

      const params = { id: "notif1" };
      const request = mockNextRequest({ isRead: true });

      const response = await PUT(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("isRead", true);
    });

    test("should verify user owns the notification", async () => {
      // Mock notification from a different user
      prismaMock.notification.findUnique.mockResolvedValueOnce(
        mockNotifications[2]
      );

      const params = { id: "notif3" };
      const request = mockNextRequest({ isRead: true });

      const response = await PUT(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Access denied");
    });
  });

  describe("DELETE /api/notifications/[id]", () => {
    test("should delete a notification", async () => {
      // Mock successful deletion
      prismaMock.notification.delete.mockResolvedValue(mockNotifications[0]);

      const params = { id: "notif1" };
      const request = mockNextRequest({});

      const response = await DELETE(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("success", true);
    });

    test("should verify user owns the notification", async () => {
      // Mock notification from a different user
      prismaMock.notification.findUnique.mockResolvedValueOnce(
        mockNotifications[2]
      );

      const params = { id: "notif3" };
      const request = mockNextRequest({});

      const response = await DELETE(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Access denied");
    });
  });

  describe("GET /api/notifications/unread", () => {
    test("should return unread notification count", async () => {
      const request = mockNextRequest({});
      const response = await GetUnreadCount(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("count", 1);
    });
  });

  describe("POST /api/notifications/mark-all-read", () => {
    test("should mark all notifications as read", async () => {
      // Mock updateMany result
      prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });

      const request = mockNextRequest({});
      const response = await MarkAllRead(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("markedAsRead", 1);
    });
  });
});
