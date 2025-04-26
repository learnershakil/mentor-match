import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { POST } from "@/app/api/mentor/messages/bulk/route";

describe("POST /api/mentor/messages/bulk", () => {
  const prismaMock = getPrismaMock();

  beforeEach(() => {
    // Set up authenticated mentor session
    mockAuthSession("MENTOR");

    // Mock mentor retrieval
    prismaMock.mentor.findFirst.mockResolvedValue({
      id: "mentor1",
      userId: "user123",
    } as any);

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

    // Mock finding existing conversations
    prismaMock.conversation.findFirst.mockResolvedValue(null);

    // Mock creating conversations
    prismaMock.conversation.create.mockResolvedValue({
      id: "conversation1",
      participants: ["user123", "user1"],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Mock creating messages
    prismaMock.message.create.mockResolvedValue({
      id: "message1",
      senderId: "user123",
      conversationId: "conversation1",
      content: "Test message",
      attachments: [],
      unread: true,
      sentAt: new Date(),
    } as any);

    // Mock creating notifications
    prismaMock.notification.create.mockResolvedValue({
      id: "notification1",
      userId: "user1",
      title: "New Message",
      content: "You have a new message from your mentor",
      type: "MESSAGE",
      isRead: false,
      createdAt: new Date(),
    } as any);
  });

  test("should send messages to multiple students", async () => {
    const requestBody = {
      studentIds: ["student1", "student2"],
      content: "Test message",
    };

    const request = mockNextRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.count).toBe(2);
    expect(prismaMock.conversation.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.message.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);

    // Check conversation creation
    expect(prismaMock.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          participants: expect.arrayContaining(["user123", "user1"]),
        }),
      })
    );

    // Check message creation
    expect(prismaMock.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderId: "user123",
          conversationId: "conversation1",
          content: "Test message",
          unread: true,
        }),
      })
    );

    // Check notification creation
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user1",
          title: "New Message",
          type: "MESSAGE",
        }),
      })
    );
  });

  test("should reuse existing conversations", async () => {
    // Mock finding an existing conversation
    prismaMock.conversation.findFirst.mockResolvedValue({
      id: "existingConversation",
      participants: ["user123", "user1"],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const requestBody = {
      studentIds: ["student1"],
      content: "Test message",
    };

    const request = mockNextRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(200);

    // Should not create a new conversation
    expect(prismaMock.conversation.create).not.toHaveBeenCalled();

    // Should use existing conversation
    expect(prismaMock.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          conversationId: "existingConversation",
        }),
      })
    );
  });

  test("should require mentor role", async () => {
    // Mock student session
    mockAuthSession("STUDENT");

    const requestBody = {
      studentIds: ["student1", "student2"],
      content: "Test message",
    };

    const request = mockNextRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Only mentors can use this endpoint");
  });

  test("should validate input data", async () => {
    // Missing student IDs
    const requestBody = {
      content: "Test message",
    };

    const request = mockNextRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Student IDs are required and must be an array");
  });
});
