import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

// Define message types
type MessageType =
  | "register"
  | "message"
  | "typing"
  | "userStatus"
  | "callInvitation"
  | "userJoin"
  | "userLeave";

// Message interfaces
interface BaseMessage {
  type: MessageType;
  timestamp?: number;
}

interface RegisterMessage extends BaseMessage {
  type: "register";
  userId: string;
  username: string;
}

interface ChatMessage extends BaseMessage {
  type: "message";
  senderId: string;
  conversationId: string;
  receiverId?: string;
  content: string;
  messageType?: string; // Add messageType field
  timestamp?: number;
}

interface TypingMessage extends BaseMessage {
  type: "typing";
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

interface UserStatusMessage extends BaseMessage {
  type: "userStatus";
  userId: string;
  status: "online" | "offline" | "away";
}

interface CallInvitationMessage extends BaseMessage {
  type: "callInvitation";
  roomId: string;
  callSessionId: string;
  creatorId: string;
  creatorName: string;
  receiverId: string;
}

interface UserJoinMessage extends BaseMessage {
  type: "userJoin";
  userId: string;
  username: string;
}

interface UserLeaveMessage extends BaseMessage {
  type: "userLeave";
  userId: string;
  username: string;
}

type ServerMessage =
  | RegisterMessage
  | ChatMessage
  | TypingMessage
  | UserStatusMessage
  | CallInvitationMessage
  | UserJoinMessage
  | UserLeaveMessage;

// Store connected clients
interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  username: string;
}

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Create HTTP server
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });
const clients: Map<string, ConnectedClient> = new Map();

// WebSocket connection handler
wss.on("connection", (ws) => {
  let clientUserId: string | null = null;

  console.log(`New client connected`);

  // Handle messages from clients
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString()) as ServerMessage;

      // Handle registration
      if (message.type === "register") {
        clientUserId = message.userId;
        const username = message.username.trim();

        if (username && clientUserId) {
          // Remove any existing connections for this user
          for (const [id, client] of clients.entries()) {
            if (client.userId === clientUserId && client.ws !== ws) {
              console.log(
                `Closing duplicate connection for user ${clientUserId}`
              );
              client.ws.close();
              clients.delete(id);
            }
          }

          // Store client information
          const clientId = uuidv4();
          clients.set(clientId, { ws, userId: clientUserId, username });

          // Notify everyone about user status
          broadcastUserStatus(clientUserId, "online");

          console.log(`User registered: ${username} (${clientUserId})`);

          // Send current online users to the newly connected client
          const onlineUsers: UserStatusMessage[] = [];
          for (const client of clients.values()) {
            if (client.userId !== clientUserId) {
              onlineUsers.push({
                type: "userStatus",
                userId: client.userId,
                status: "online",
              });
            }
          }

          if (onlineUsers.length > 0) {
            ws.send(JSON.stringify(onlineUsers));
          }
        }
      }
      // Handle chat messages
      else if (message.type === "message") {
        handleChatMessage(message);
      }
      // Handle typing indicators
      else if (message.type === "typing") {
        handleTypingIndicator(message);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    if (clientUserId) {
      // Find the client entry to remove
      let clientIdToRemove: string | null = null;
      for (const [id, client] of clients.entries()) {
        if (client.userId === clientUserId && client.ws === ws) {
          clientIdToRemove = id;
          break;
        }
      }

      if (clientIdToRemove) {
        const client = clients.get(clientIdToRemove);
        console.log(
          `Client disconnected: ${client?.username} (${clientUserId})`
        );

        // Remove client from map
        clients.delete(clientIdToRemove);

        // Check if user has other active connections
        let hasOtherConnections = false;
        for (const client of clients.values()) {
          if (client.userId === clientUserId) {
            hasOtherConnections = true;
            break;
          }
        }

        // Only broadcast offline status if no other connections exist
        if (!hasOtherConnections) {
          broadcastUserStatus(clientUserId, "offline");
        }
      }
    }
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`WebSocket error:`, error);
  });
});

// Function to handle chat messages
function handleChatMessage(message: ChatMessage) {
  const {
    senderId,
    conversationId,
    receiverId,
    content,
    messageType = "TEXT",
  } = message;

  // Add timestamp if not provided
  if (!message.timestamp) {
    message.timestamp = Date.now();
  }

  console.log(
    `Chat message (${messageType}) from ${senderId} to conversation ${conversationId}: ${content.substring(
      0,
      50
    )}${content.length > 50 ? "..." : ""}`
  );

  // Find clients to send to (either by conversation ID or direct to receiver)
  const recipientClients: ConnectedClient[] = [];

  if (receiverId) {
    // Direct message to specific user
    for (const client of clients.values()) {
      if (client.userId === receiverId) {
        recipientClients.push(client);
      }
    }
  } else {
    // Broadcast to all users in the conversation (in a real app, you'd get this from a database)
    for (const client of clients.values()) {
      // Skip the sender
      if (client.userId !== senderId) {
        // In a real app with a database, you'd check if the user is part of the conversation
        // For now, we'll assume all users are part of all conversations for demo purposes
        recipientClients.push(client);
      }
    }
  }

  // Send the message to all recipients
  const messageStr = JSON.stringify(message);
  for (const client of recipientClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  }
}

// Function to handle typing indicators
function handleTypingIndicator(message: TypingMessage) {
  const { userId, conversationId, isTyping } = message;

  console.log(
    `Typing indicator from ${userId} in conversation ${conversationId}: ${
      isTyping ? "typing" : "stopped typing"
    }`
  );

  // Broadcast to all users in the conversation (except the sender)
  for (const client of clients.values()) {
    if (client.userId !== userId && client.ws.readyState === WebSocket.OPEN) {
      // In a real app, you'd check if the user is part of the conversation
      client.ws.send(JSON.stringify(message));
    }
  }
}

// Function to broadcast user status changes
function broadcastUserStatus(
  userId: string,
  status: "online" | "offline" | "away"
) {
  const statusMessage: UserStatusMessage = {
    type: "userStatus",
    userId,
    status,
    timestamp: Date.now(),
  };

  const messageStr = JSON.stringify(statusMessage);

  // Broadcast to all connected clients except the user
  for (const client of clients.values()) {
    if (client.userId !== userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  }
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("WebSocket server is running");
});

// Graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("Shutting down server...");

  // Close all WebSocket connections
  for (const client of clients.values()) {
    client.ws.close();
  }

  // Clear the clients map
  clients.clear();

  // Close the HTTP server
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}
