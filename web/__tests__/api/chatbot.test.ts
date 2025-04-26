import { NextResponse } from "next/server";
import { mockNextRequest, mockAuthSession } from "../utils/apiTestHelpers";
import { getPrismaMock } from "../mocks/prismaMock";
import { POST } from "@/app/api/chatbot/route";
import { GoogleGenerativeAI } from "@google/generative-ai";

describe("Chatbot API", () => {
  const prismaMock = getPrismaMock();

  beforeEach(() => {
    // Set up authenticated session for testing
    mockAuthSession("STUDENT");

    // Mock user data retrieval
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user123",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "STUDENT",
      intrest: "WebDevelopment",
      createdAt: new Date(),
      updatedAt: new Date(),
      password: "hashed-password",
      phone: null,
      image: null,
      bio: null,
    });
  });

  test("should return error for unauthorized requests", async () => {
    // Mock no session
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const request = mockNextRequest({ message: "Hello" });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  test("should return error if message is missing", async () => {
    const request = mockNextRequest({ history: [] }); // No message
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Message is required");
  });

  test("should generate a response for a valid message", async () => {
    const request = mockNextRequest({
      message: "What are some good resources for learning React?",
      history: [],
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("response");
    expect(data).toHaveProperty("history");
    expect(data.history).toHaveLength(2); // User message + model response
    expect(data.history[0].role).toBe("user");
    expect(data.history[1].role).toBe("model");
  });

  test("should use conversation history for context", async () => {
    const history = [
      { role: "user", content: "What is React?" },
      {
        role: "model",
        content: "React is a JavaScript library for building user interfaces.",
      },
    ];

    const request = mockNextRequest({
      message: "How does it compare to Angular?",
      history,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.history).toHaveLength(4); // Previous 2 + new user message + new model response
  });

  test("should personalize response based on user role", async () => {
    // Mock a mentor user
    mockAuthSession("MENTOR");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "mentor123",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      role: "MENTOR",
      intrest: "AiMl",
      createdAt: new Date(),
      updatedAt: new Date(),
      password: "hashed-password",
      phone: null,
      image: null,
      bio: null,
    });

    const request = mockNextRequest({
      message: "How can I help my students better?",
      history: [],
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    // The Google Generative AI is mocked, so we can't check the actual response content,
    // but we can confirm the API call was successfully made
    const data = await response.json();
    expect(data).toHaveProperty("response");
  });

  test("should handle errors from the AI service", async () => {
    // Mock AI service error
    jest
      .spyOn(GoogleGenerativeAI.prototype, "getGenerativeModel")
      .mockImplementationOnce(() => {
        return {
          generateContent: jest
            .fn()
            .mockRejectedValueOnce(new Error("AI service error")),
        } as any;
      });

    const request = mockNextRequest({
      message: "This will cause an error",
      history: [],
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to process request");
  });
});
