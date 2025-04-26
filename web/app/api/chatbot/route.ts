import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    // @ts-ignore
    const session = await getServerSession(NEXT_AUTH_CONFIG);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch user-specific data to personalize responses
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: session.user.role === "STUDENT",
        mentor: session.user.role === "MENTOR",
      },
    });

    // Generate context prompt with user information
    let contextPrompt = `You are a helpful AI assistant for the Mentor Match platform. `;

    if (user) {
      contextPrompt += `You're speaking with ${user.firstName} ${
        user.lastName
      }, who is a ${user.role.toLowerCase()}. `;

      if (user.role === "STUDENT") {
        contextPrompt += `Their learning interest is ${user.intrest}. `;
      } else if (user.role === "MENTOR") {
        contextPrompt += `They are a mentor specializing in ${user.intrest}. `;
      }
    }

    contextPrompt += `Answer questions about programming, learning resources, and mentorship. 
    Be supportive, educational, and provide specific, actionable advice when possible. 
    When asked about technical topics, provide accurate and helpful information.
    If you don't know something, admit it and suggest where they might find the information.
    IMPORTANT: Keep all responses in plain text (no markdown), concise, and under 350 characters.`;

    // Clean up the prompt
    contextPrompt = contextPrompt.replace(/\s+/g, " ").trim();

    // Set up Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Convert history to a conversation string to provide context
    let conversationContext = "";
    if (history.length > 0) {
      for (const entry of history) {
        if (entry.role === "user") {
          conversationContext += `User: ${entry.content}\n`;
        } else {
          conversationContext += `Assistant: ${entry.content}\n`;
        }
      }
    }

    // Combine context, history, and current message
    const prompt = `${contextPrompt}\n\n${
      conversationContext
        ? "Previous conversation:\n" + conversationContext
        : ""
    }\nUser: ${message}\nAssistant:`;

    // Generate content directly instead of using chat
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 150, // Limiting token count to encourage shorter responses
      },
    });

    const response = await result.response;
    let text = response.text();

    // Ensure response is under 350 characters
    if (text.length > 350) {
      text = text.substring(0, 347) + "...";
    }

    return NextResponse.json({
      response: text,
      history: [
        ...history,
        { role: "user", content: message },
        { role: "model", content: text },
      ],
    });
  } catch (error) {
    console.error("Error in chatbot:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to process request", details: errorMessage },
      { status: 500 }
    );
  }
}
