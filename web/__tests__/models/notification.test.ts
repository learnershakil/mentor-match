import { NotificationType } from "@prisma/client";
import { mockReset } from "jest-mock-extended";
import { getPrismaMock } from "../mocks/prismaMock";

describe("Notification Model", () => {
  const prismaMock = getPrismaMock();

  // Mock notification data
  const mockNotification = {
    id: "notif123",
    userId: "user123",
    title: "New Assignment",
    content: "You have a new assignment",
    type: "ASSIGNMENT" as NotificationType,
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockReset(prismaMock);
  });

  test("should create a notification", async () => {
    prismaMock.notification.create.mockResolvedValue(mockNotification);

    const notification = await prismaMock.notification.create({
      data: {
        userId: "user123",
        title: "New Assignment",
        content: "You have a new assignment",
        type: "ASSIGNMENT",
      },
    });

    expect(notification).toEqual(mockNotification);
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
  });

  test("should find notifications for a user", async () => {
    prismaMock.notification.findMany.mockResolvedValue([mockNotification]);

    const notifications = await prismaMock.notification.findMany({
      where: { userId: "user123" },
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual(mockNotification);
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { userId: "user123" },
    });
  });

  test("should count unread notifications", async () => {
    prismaMock.notification.count.mockResolvedValue(1);

    const count = await prismaMock.notification.count({
      where: { userId: "user123", isRead: false },
    });

    expect(count).toBe(1);
    expect(prismaMock.notification.count).toHaveBeenCalledWith({
      where: { userId: "user123", isRead: false },
    });
  });

  test("should mark notification as read", async () => {
    const updatedNotification = { ...mockNotification, isRead: true };
    prismaMock.notification.update.mockResolvedValue(updatedNotification);

    const notification = await prismaMock.notification.update({
      where: { id: "notif123" },
      data: { isRead: true },
    });

    expect(notification).toEqual(updatedNotification);
    expect(prismaMock.notification.update).toHaveBeenCalledWith({
      where: { id: "notif123" },
      data: { isRead: true },
    });
  });

  test("should mark all notifications as read", async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

    const result = await prismaMock.notification.updateMany({
      where: { userId: "user123", isRead: false },
      data: { isRead: true },
    });

    expect(result.count).toBe(3);
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user123", isRead: false },
      data: { isRead: true },
    });
  });

  test("should delete a notification", async () => {
    prismaMock.notification.delete.mockResolvedValue(mockNotification);

    const notification = await prismaMock.notification.delete({
      where: { id: "notif123" },
    });

    expect(notification).toEqual(mockNotification);
    expect(prismaMock.notification.delete).toHaveBeenCalledWith({
      where: { id: "notif123" },
    });
  });
});
