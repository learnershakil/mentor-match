import { format } from "date-fns";

// Sample message data generator
export function createDemoMessages(conversationId: string, query = ""): any[] {
  const now = new Date();

  // Create a set of demo messages based on contact ID
  const demoSets: Record<string, any[]> = {
    "demo-conv-1": [
      {
        id: 101,
        senderId: "demo-user-1",
        content: "Hi there! How's your progress with the React components?",
        sentAt: new Date(now.getTime() - 30 * 60000).toISOString(),
        readAt: new Date(now.getTime() - 28 * 60000).toISOString(),
        attachments: [],
      },
      {
        id: 102,
        senderId: "current-user-id",
        content:
          "I'm doing well! I've completed the Button and Card components, but I'm having some issues with the Modal component.",
        sentAt: new Date(now.getTime() - 25 * 60000).toISOString(),
        readAt: new Date(now.getTime() - 24 * 60000).toISOString(),
        attachments: [],
      },
      {
        id: 103,
        senderId: "demo-user-1",
        content:
          "That's great progress! The Modal can be tricky. What specific issues are you facing?",
        sentAt: new Date(now.getTime() - 20 * 60000).toISOString(),
        readAt: new Date(now.getTime() - 19 * 60000).toISOString(),
        attachments: [],
      },
      {
        id: 104,
        senderId: "current-user-id",
        content:
          "I'm having trouble with the focus management when the modal opens. The focus doesn't trap inside the modal.",
        sentAt: new Date(now.getTime() - 15 * 60000).toISOString(),
        readAt: new Date(now.getTime() - 14 * 60000).toISOString(),
        attachments: [],
      },
      {
        id: 105,
        senderId: "demo-user-1",
        content:
          "Ah, I see. For focus management, you should use the FocusTrap component or a library like focus-trap-react. It handles all the keyboard navigation and accessibility concerns.",
        sentAt: new Date(now.getTime() - 10 * 60000).toISOString(),
        readAt: new Date(now.getTime() - 9 * 60000).toISOString(),
        attachments: ["https://example.com/focus-trap-examples.zip"],
      },
      {
        id: 106,
        senderId: "demo-user-1",
        content:
          "Let me know if you have any questions about the React components. We can also discuss this in our next session if you'd like.",
        sentAt: new Date(now.getTime() - 5 * 60000).toISOString(),
        readAt: null,
        attachments: [],
      },
    ],
    "demo-conv-2": [
      {
        id: 201,
        senderId: "demo-user-2",
        content:
          "Hello! I reviewed your latest neural network assignment. Great work on implementing the backpropagation algorithm.",
        sentAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 1.9 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 202,
        senderId: "current-user-id",
        content:
          "Thank you! I spent a lot of time understanding how gradients flow through the network.",
        sentAt: new Date(now.getTime() - 1.8 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 1.7 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 203,
        senderId: "demo-user-2",
        content:
          "It shows! For next week, let's explore convolutional neural networks. They're particularly effective for image processing tasks.",
        sentAt: new Date(now.getTime() - 1.5 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 1.4 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 204,
        senderId: "current-user-id",
        content:
          "I'm looking forward to it. I've been reading about CNNs and their applications in computer vision.",
        sentAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 0.9 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 205,
        senderId: "demo-user-2",
        content:
          "Great initiative! We'll continue with neural networks in our next session.",
        sentAt: new Date(now.getTime() - 30 * 60000).toISOString(),
        readAt: null,
        attachments: [],
      },
    ],
    "demo-conv-3": [
      {
        id: 301,
        senderId: "demo-user-3",
        content: "Hey, I've started working on the project we discussed.",
        sentAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 3.9 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 302,
        senderId: "current-user-id",
        content: "That's great news! How's it going so far?",
        sentAt: new Date(now.getTime() - 3.8 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 3.7 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 303,
        senderId: "demo-user-3",
        content:
          "I've set up the basic structure and implemented some core features. I'll share a demo later today.",
        sentAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 2.9 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 304,
        senderId: "current-user-id",
        content: "Sounds promising! I'm eager to see your progress.",
        sentAt: new Date(now.getTime() - 2.8 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 2.7 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 305,
        senderId: "demo-user-3",
        content: "I'm working on the project now. Will share updates soon.",
        sentAt: new Date(now.getTime() - 20 * 60000).toISOString(),
        readAt: null,
        attachments: [],
      },
    ],
    "demo-conv-4": [
      {
        id: 401,
        senderId: "demo-user-4",
        content: "Hi! I reviewed the user flow diagrams you sent over.",
        sentAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
        readAt: null,
        attachments: [],
      },
      {
        id: 402,
        senderId: "demo-user-4",
        content:
          "Your approach to the checkout process is innovative, but we might need to simplify it for mobile users.",
        sentAt: new Date(now.getTime() - 4.9 * 3600000).toISOString(),
        readAt: null,
        attachments: [],
      },
      {
        id: 403,
        senderId: "demo-user-4",
        content: "The wireframes look great! Let's discuss on our next call.",
        sentAt: new Date(now.getTime() - 4.8 * 3600000).toISOString(),
        readAt: null,
        attachments: [],
      },
    ],
    "demo-conv-5": [
      {
        id: 501,
        senderId: "demo-user-5",
        content:
          "Hello, I wanted to share some resources on encryption protocols we discussed in our last session.",
        sentAt: new Date(now.getTime() - 3 * 24 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 2.9 * 24 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 502,
        senderId: "current-user-id",
        content: "Thanks! That would be very helpful for my current project.",
        sentAt: new Date(now.getTime() - 2.8 * 24 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 2.7 * 24 * 3600000).toISOString(),
        attachments: [],
      },
      {
        id: 503,
        senderId: "demo-user-5",
        content:
          "Here's the reference to the security protocol we discussed: https://example.com/security-protocols",
        sentAt: new Date(now.getTime() - 2.5 * 24 * 3600000).toISOString(),
        readAt: new Date(now.getTime() - 2.4 * 24 * 3600000).toISOString(),
        attachments: ["https://example.com/security-protocols.pdf"],
      },
    ],
  };

  // If conversationId not found in demo sets, return a generic conversation
  const messages = demoSets[conversationId] || [
    {
      id: 901,
      senderId: conversationId.replace("demo-conv-", "demo-user-"),
      content: "Hello! How can I help you today?",
      sentAt: new Date(now.getTime() - 10 * 60000).toISOString(),
      readAt: new Date(now.getTime() - 9 * 60000).toISOString(),
      attachments: [],
    },
    {
      id: 902,
      senderId: "current-user-id",
      content: "Hi there! Looking forward to our mentoring sessions.",
      sentAt: new Date(now.getTime() - 5 * 60000).toISOString(),
      readAt: null,
      attachments: [],
    },
  ];

  // Add sender object to each message to match API response format
  return messages.map((msg) => ({
    ...msg,
    sender: {
      id: msg.senderId,
      firstName:
        msg.senderId === "current-user-id"
          ? "You"
          : conversationId === "demo-conv-1"
          ? "Emma"
          : conversationId === "demo-conv-2"
          ? "Alex"
          : conversationId === "demo-conv-3"
          ? "Shakil"
          : conversationId === "demo-conv-4"
          ? "Sarah"
          : conversationId === "demo-conv-5"
          ? "Michael"
          : "Contact",
      lastName:
        msg.senderId === "current-user-id"
          ? ""
          : conversationId === "demo-conv-1"
          ? "Wilson"
          : conversationId === "demo-conv-2"
          ? "Rivera"
          : conversationId === "demo-conv-3"
          ? "Ahmed"
          : conversationId === "demo-conv-4"
          ? "Johnson"
          : conversationId === "demo-conv-5"
          ? "Chen"
          : "",
      image: "/placeholder.svg?height=40&width=40",
    },
  }));
}
