import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Define message structures
interface BaseMessage {
  type: string;
  id: string;
}

interface ChatMessage extends BaseMessage {
  type: "message";
  senderId: string;
  conversationId: string;
  receiverId?: string;
  text: string;
  timestamp: number;
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
    name?: string;
    size?: string;
  }>;
  messageType?:
    | "TEXT"
    | "FILE"
    | "CALL_STARTED"
    | "CALL_ENDED"
    | "CALL_MISSED"
    | "SYSTEM";
}

interface UserStatusMessage extends BaseMessage {
  type: "userStatus";
  userId: string;
  status: "online" | "offline" | "away";
}

interface CallSignalingMessage extends BaseMessage {
  type: "callSignaling";
  signalType:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "call-start"
    | "call-end"
    | "user-joined"
    | "user-left";
  senderId: string;
  receiverId?: string;
  roomId: string;
  payload: any;
}

interface JoinRoomMessage extends BaseMessage {
  type: "joinRoom";
  userId: string;
  roomId: string;
  username: string;
}

interface LeaveRoomMessage extends BaseMessage {
  type: "leaveRoom";
  userId: string;
  roomId: string;
}

type ServerMessage =
  | ChatMessage
  | UserStatusMessage
  | CallSignalingMessage
  | JoinRoomMessage
  | LeaveRoomMessage;

// Store connected clients
interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  username: string;
  rooms: Set<string>;
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Real-time server is running...");
});

const wss = new WebSocketServer({ server });
const clients: Map<string, ConnectedClient> = new Map();
const rooms: Map<string, Set<string>> = new Map(); // roomId -> set of userIds

// Handle WebSocket connections
wss.on("connection", (ws) => {
  const clientId = uuidv4();
  console.log(`New client connected: ${clientId}`);

  // Handle messages from clients
  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Received message from ${clientId}:`, message.type);

      // Handle user registration
      if (message.type === "register") {
        const userId = message.userId;
        const username = message.username;

        if (userId && username) {
          // Store client information
          clients.set(clientId, {
            ws,
            userId,
            username,
            rooms: new Set(),
          });

          // Notify users about status change
          broadcastUserStatus({
            type: "userStatus",
            id: uuidv4(),
            userId,
            status: "online",
          });

          console.log(`User registered: ${username} (${userId})`);

          // Send confirmation back to client
          ws.send(
            JSON.stringify({
              type: "registerConfirm",
              id: uuidv4(),
              userId,
            })
          );
        }
      }

      // Handle chat messages
      else if (message.type === "message") {
        const client = clients.get(clientId);
        if (!client) return;

        const {
          senderId,
          receiverId,
          conversationId,
          text,
          attachments,
          messageType,
        } = message;

        // Create message in database
        try {
          const dbMessage = await prisma.message.create({
            data: {
              senderId,
              receiverId,
              conversationId,
              content: text,
              // @ts-ignore
              messageType: messageType || "TEXT",
              // @ts-ignore
              attachments: attachments?.map((a) => a.url) || [],
              unread: true,
            },
          });

          const chatMessage: ChatMessage = {
            type: "message",
            id: dbMessage.id,
            senderId,
            conversationId,
            receiverId,
            text,
            timestamp: Date.now(),
            attachments,
            messageType: messageType,
          };

          // Find the receiver and send message directly if online
          if (receiverId) {
            const receiverClient = Array.from(clients.values()).find(
              (c) => c.userId === receiverId
            );
            if (receiverClient) {
              receiverClient.ws.send(JSON.stringify(chatMessage));
            }
          }

          // Also broadcast to conversation members if in a group conversation
          else if (conversationId) {
            broadcastToConversation(conversationId, chatMessage);
          }

          // Send confirmation back to sender
          ws.send(
            JSON.stringify({
              type: "messageConfirm",
              id: dbMessage.id,
              originalId: message.id,
            })
          );
        } catch (error) {
          console.error("Error saving message to database:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              id: uuidv4(),
              message: "Failed to save message",
            })
          );
        }
      }

      // Handle call signaling
      else if (message.type === "callSignaling") {
        const client = clients.get(clientId);
        if (!client) return;

        const { signalType, roomId, senderId, receiverId, payload } = message;

        // Handle call start
        if (signalType === "call-start") {
          try {
            // Create a call session record
            // @ts-ignore
            const callSession = await prisma.callSession.create({
              data: {
                roomId,
                participants: [senderId],
                // Add initial participant (caller)
              },
            });

            // Create a system message about call starting
            await prisma.message.create({
              data: {
                senderId,
                conversationId: payload.conversationId,
                content: `Call started by ${client.username}`,
                // @ts-ignore
                messageType: "CALL_STARTED",
                callSessionId: callSession.id,
              },
            });

            // Make sure room exists
            if (!rooms.has(roomId)) {
              rooms.set(roomId, new Set([senderId]));
            } else {
              rooms.get(roomId)?.add(senderId);
            }

            // Add client to the room
            client.rooms.add(roomId);

            // Forward to specific receiver if provided
            if (receiverId) {
              const receiverClient = Array.from(clients.values()).find(
                (c) => c.userId === receiverId
              );
              if (receiverClient) {
                receiverClient.ws.send(JSON.stringify(message));
              }
            }
          } catch (error) {
            console.error("Error creating call session:", error);
          }
        }

        // Handle call end
        else if (signalType === "call-end") {
          try {
            // Update call session
            // @ts-ignore
            const callSession = await prisma.callSession.findFirst({
              where: { roomId },
            });

            if (callSession) {
              const duration = Math.floor(
                (Date.now() - callSession.createdAt.getTime()) / 1000
              );

              // @ts-ignore
              await prisma.callSession.update({
                where: { id: callSession.id },
                data: {
                  endedAt: new Date(),
                  duration,
                },
              });

              // Create a system message about call ending
              await prisma.message.create({
                data: {
                  senderId,
                  conversationId: payload.conversationId,
                  content: `Call ended, duration: ${formatDuration(duration)}`,
                  // @ts-ignore
                  messageType: "CALL_ENDED",
                  callSessionId: callSession.id,
                },
              });
            }

            // Broadcast to all room participants
            broadcastToRoom(roomId, message);

            // Clean up room
            if (rooms.has(roomId)) {
              rooms.delete(roomId);
            }

            // Remove clients from the room
            for (const c of clients.values()) {
              c.rooms.delete(roomId);
            }
          } catch (error) {
            console.error("Error updating call session:", error);
          }
        }

        // Handle other signaling messages
        else {
          if (receiverId) {
            // Direct signaling to specific user
            const receiverClient = Array.from(clients.values()).find(
              (c) => c.userId === receiverId
            );
            if (receiverClient) {
              receiverClient.ws.send(JSON.stringify(message));
            }
          } else {
            // Broadcast to room (except sender)
            broadcastToRoom(roomId, message, senderId);
          }
        }
      }

      // Handle room join
      else if (message.type === "joinRoom") {
        const client = clients.get(clientId);
        if (!client) return;

        const { userId, roomId } = message;

        // Update room participants
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set([userId]));
        } else {
          rooms.get(roomId)?.add(userId);
        }

        // Add room to client
        client.rooms.add(roomId);

        // Update call session in database
        try {
          // @ts-ignore
          const callSession = await prisma.callSession.findFirst({
            where: { roomId },
          });

          if (callSession) {
            const currentParticipants = new Set(callSession.participants);
            currentParticipants.add(userId);

            // @ts-ignore
            await prisma.callSession.update({
              where: { id: callSession.id },
              data: {
                participants: Array.from(currentParticipants),
              },
            });
          }
        } catch (error) {
          console.error("Error updating call session participants:", error);
        }

        // Notify others in the room
        broadcastToRoom(roomId, {
          type: "userJoined",
          id: uuidv4(),
          userId,
          roomId,
          username: client.username,
        });
      }

      // Handle room leave
      else if (message.type === "leaveRoom") {
        const client = clients.get(clientId);
        if (!client) return;

        const { userId, roomId } = message;

        // Remove user from room
        rooms.get(roomId)?.delete(userId);
        client.rooms.delete(roomId);

        // Clean up empty rooms
        if (rooms.has(roomId) && rooms.get(roomId)?.size === 0) {
          rooms.delete(roomId);
        }

        // Notify others
        broadcastToRoom(roomId, {
          type: "userLeft",
          id: uuidv4(),
          userId,
          roomId,
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle disconnection
  ws.on("close", async () => {
    const client = clients.get(clientId);
    if (client) {
      console.log(`Client disconnected: ${client.username} (${client.userId})`);

      // Notify others about user leaving rooms
      for (const roomId of client.rooms) {
        broadcastToRoom(roomId, {
          type: "userLeft",
          id: uuidv4(),
          userId: client.userId,
          roomId,
        });

        // Remove user from room
        rooms.get(roomId)?.delete(client.userId);

        // Clean up empty rooms
        if (rooms.has(roomId) && rooms.get(roomId)?.size === 0) {
          rooms.delete(roomId);
        }
      }

      // Notify about status change
      broadcastUserStatus({
        type: "userStatus",
        id: uuidv4(),
        userId: client.userId,
        status: "offline",
      });

      // Remove client from map
      clients.delete(clientId);
    }
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

// API routes
app.get("/api/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      include: {
        messages: {
          orderBy: {
            sentAt: "desc",
          },
          take: 1,
        },
      },
    });

    // Get user details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        // Get IDs of other participants
        const otherParticipantIds = conversation.participants.filter(
          (p) => p !== userId
        );

        // Get user details for those participants
        const participantDetails = await prisma.user.findMany({
          where: {
            id: {
              in: otherParticipantIds,
            },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true,
          },
        });

        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: {
              not: userId,
            },
            unread: true,
          },
        });

        return {
          id: conversation.id,
          participants: participantDetails,
          lastMessage: conversation.messages[0] || null,
          unreadCount,
        };
      })
    );

    res.json(conversationsWithDetails);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

app.get("/api/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        sentAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        // @ts-ignore
        callSession: true,
      },
    });

    // Mark messages as read if userId is provided
    if (userId) {
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: {
            not: userId as string,
          },
          unread: true,
        },
        data: {
          unread: false,
          readAt: new Date(),
        },
      });
    }

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Create new conversation or return existing
// @ts-ignore
app.post("/api/conversations", async (req, res) => {
  try {
    const { participants } = req.body;

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length < 2
    ) {
      return res
        .status(400)
        .json({ error: "At least two participants are required" });
    }

    // Sort participant IDs for consistent lookups
    const sortedParticipants = [...participants].sort();

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          equals: sortedParticipants,
        },
      },
    });

    if (existingConversation) {
      return res.json({ conversation: existingConversation, created: false });
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: sortedParticipants,
      },
    });

    res.json({ conversation: newConversation, created: true });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Video call rooms API
// @ts-ignore
app.post("/api/call-rooms", async (req, res) => {
  try {
    const { creatorId, participantIds = [], conversationId } = req.body;

    if (!creatorId) {
      return res.status(400).json({ error: "Creator ID is required" });
    }

    // Generate room ID
    const roomId = uuidv4();

    // Create call session in database
    // @ts-ignore
    const callSession = await prisma.callSession.create({
      data: {
        roomId,
        participants: [creatorId, ...participantIds],
        messages: {
          create: {
            senderId: creatorId,
            conversationId,
            content: "Video call started",
            messageType: "CALL_STARTED",
          },
        },
      },
      include: {
        messages: true,
      },
    });

    res.json({
      roomId,
      callSessionId: callSession.id,
      messageId: callSession.messages[0]?.id,
    });
  } catch (error) {
    console.error("Error creating call room:", error);
    res.status(500).json({ error: "Failed to create call room" });
  }
});

// @ts-ignore
app.get("/api/call-rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    // @ts-ignore
    const callSession = await prisma.callSession.findFirst({
      where: { roomId },
      include: {
        messages: {
          orderBy: {
            sentAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!callSession) {
      return res.status(404).json({ error: "Call room not found" });
    }

    // Check if call is active (no endedAt)
    const isActive = !callSession.endedAt;

    // Get current participants from WebSocket rooms
    const activeParticipantIds = Array.from(rooms.get(roomId) || []);

    // Get user details for participants
    const participantDetails = await prisma.user.findMany({
      where: {
        id: {
          in: callSession.participants,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
      },
    });

    res.json({
      roomId,
      callSessionId: callSession.id,
      isActive,
      participants: participantDetails,
      activeParticipantIds,
      startedAt: callSession.createdAt,
      endedAt: callSession.endedAt,
      duration: callSession.duration,
    });
  } catch (error) {
    console.error("Error fetching call room:", error);
    res.status(500).json({ error: "Failed to fetch call room" });
  }
});

// Add an endpoint to get active rooms information
app.get("/api/active-rooms", async (req, res) => {
  try {
    const activeRooms = Array.from(rooms.entries()).map(
      ([roomId, participants]) => ({
        roomId,
        participantCount: participants.size,
        participants: Array.from(participants),
      })
    );

    res.json(activeRooms);
  } catch (error) {
    console.error("Error fetching active rooms:", error);
    res.status(500).json({ error: "Failed to fetch active rooms" });
  }
});

// Add endpoint to get call history for a user
app.get("/api/call-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // @ts-ignore
    const callHistory = await prisma.callSession.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: {
          where: {
            OR: [
              { messageType: "CALL_STARTED" },
              { messageType: "CALL_ENDED" },
            ],
          },
          orderBy: {
            sentAt: "asc",
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
        },
      },
    });

    res.json(callHistory);
  } catch (error) {
    console.error("Error fetching call history:", error);
    res.status(500).json({ error: "Failed to fetch call history" });
  }
});

// Add enhanced video room creation with additional options
// @ts-ignore
app.post("/api/video-rooms", async (req, res) => {
  try {
    const {
      creatorId,
      participantIds = [],
      conversationId,
      title = "Video Call",
      recordEnabled = false,
    } = req.body;

    if (!creatorId || !conversationId) {
      return res
        .status(400)
        .json({ error: "Creator ID and conversation ID are required" });
    }

    // Generate room ID with a more readable format
    const roomId = `room-${Math.random()
      .toString(36)
      .substring(2, 8)}-${Date.now().toString().substring(9)}`;

    // Get creator details
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { firstName: true, lastName: true },
    });

    const creatorName = creator
      ? `${creator.firstName} ${creator.lastName}`
      : "User";

    // Create call session in database
    // @ts-ignore
    const callSession = await prisma.callSession.create({
      data: {
        roomId,
        participants: [creatorId, ...participantIds],
        messages: {
          create: {
            senderId: creatorId,
            conversationId,
            content: `${title} started by ${creatorName}`,
            messageType: "CALL_STARTED",
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // Notify participants via WebSocket if they're online
    // @ts-ignore
    participantIds.forEach((participantId) => {
      const participant = Array.from(clients.values()).find(
        (c) => c.userId === participantId
      );
      if (participant && participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(
          JSON.stringify({
            type: "callInvitation",
            id: uuidv4(),
            roomId,
            callSessionId: callSession.id,
            creatorId,
            creatorName,
            title,
          })
        );
      }
    });

    res.json({
      roomId,
      callSessionId: callSession.id,
      messageId: callSession.messages[0]?.id,
      joinLink: `/video-call/${roomId}`,
    });
  } catch (error) {
    console.error("Error creating video room:", error);
    res.status(500).json({ error: "Failed to create video room" });
  }
});

// Join existing room with credentials check
// @ts-ignore
app.post("/api/video-rooms/:roomId/join", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, displayName } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if room exists in database
    // @ts-ignore
    const callSession = await prisma.callSession.findFirst({
      where: { roomId },
    });

    if (!callSession) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if call is still active (no endedAt)
    if (callSession.endedAt) {
      return res.status(400).json({ error: "Call has already ended" });
    }

    // Add user to participants if not already there
    const participants = new Set(callSession.participants);
    const wasAdded = !participants.has(userId);

    if (wasAdded) {
      participants.add(userId);
      // @ts-ignore
      await prisma.callSession.update({
        where: { id: callSession.id },
        data: {
          participants: Array.from(participants),
        },
      });
    }

    res.json({
      success: true,
      roomId,
      callSessionId: callSession.id,
      isNewParticipant: wasAdded,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

// End call explicitly
// @ts-ignore
app.post("/api/video-rooms/:roomId/end", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, conversationId } = req.body;

    if (!userId || !conversationId) {
      return res
        .status(400)
        .json({ error: "User ID and conversation ID are required" });
    }

    // Get call session
    // @ts-ignore
    const callSession = await prisma.callSession.findFirst({
      where: { roomId },
    });

    if (!callSession) {
      return res.status(404).json({ error: "Call session not found" });
    }

    // Only allow if user is a participant
    if (!callSession.participants.includes(userId)) {
      return res
        .status(403)
        .json({ error: "User is not a participant in this call" });
    }

    // Calculate duration
    const duration = callSession.endedAt
      ? callSession.duration
      : Math.floor((Date.now() - callSession.createdAt.getTime()) / 1000);

    // Update call session to ended if not already
    if (!callSession.endedAt) {
      // @ts-ignore
      await prisma.callSession.update({
        where: { id: callSession.id },
        data: {
          endedAt: new Date(),
          duration,
        },
      });

      // Create a system message about call ending
      await prisma.message.create({
        data: {
          senderId: userId,
          conversationId,
          // @ts-ignore
          content: `Call ended, duration: ${formatDuration(duration)}`,
          // @ts-ignore
          messageType: "CALL_ENDED",
          callSessionId: callSession.id,
        },
      });

      // Notify all room participants
      broadcastToRoom(roomId, {
        type: "callEnded",
        id: uuidv4(),
        roomId,
        endedBy: userId,
        duration,
      });

      // Clean up room
      if (rooms.has(roomId)) {
        rooms.delete(roomId);
      }

      // Remove room from all clients
      for (const client of clients.values()) {
        client.rooms.delete(roomId);
      }
    }

    res.json({
      success: true,
      duration,
      endedAt: callSession.endedAt || new Date(),
    });
  } catch (error) {
    console.error("Error ending call:", error);
    res.status(500).json({ error: "Failed to end call" });
  }
});

// Add a text message during a call
// @ts-ignore
app.post("/api/video-rooms/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderId, text, conversationId } = req.body;

    if (!senderId || !text || !conversationId) {
      return res.status(400).json({
        error: "Sender ID, text, and conversation ID are required",
      });
    }

    // Get call session
    // @ts-ignore
    const callSession = await prisma.callSession.findFirst({
      where: { roomId },
    });

    if (!callSession) {
      return res.status(404).json({ error: "Call session not found" });
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        senderId,
        conversationId,
        content: text,
        // @ts-ignore
        messageType: "TEXT",
        callSessionId: callSession.id,
      },
    });

    // Broadcast to room participants
    broadcastToRoom(roomId, {
      type: "chatMessage",
      id: message.id,
      senderId,
      text,
      timestamp: Date.now(),
      callSessionId: callSession.id,
    });

    res.json(message);
  } catch (error) {
    console.error("Error sending call message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Add search contacts API endpoint
// @ts-ignore
app.get("/api/contacts/search", async (req, res) => {
  try {
    const { query, userId, filter } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Base query to find users that the current user has conversations with
    const userConversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId as string,
        },
      },
      select: {
        participants: true,
        id: true,
      },
    });

    // Extract all participant IDs except the current user
    const contactIds = userConversations.flatMap((conversation) =>
      conversation.participants.filter((id) => id !== userId)
    );

    // Build the search query
    const searchConditions: any = {
      id: {
        in: contactIds, // Only search among contacts with existing conversations
      },
    };

    // Add search by name if query provided
    if (query && typeof query === "string" && query.trim() !== "") {
      searchConditions.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    // Find matching users
    const users = await prisma.user.findMany({
      where: searchConditions,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        role: true,
      },
    });

    // For each contact, find their conversation with the current user and last message
    const contactsWithDetails = await Promise.all(
      users.map(async (user) => {
        // Find conversation with this user
        const conversation = userConversations.find((conv) =>
          conv.participants.includes(user.id)
        );

        if (!conversation) return null;

        // Get last message and unread count
        const lastMessage = await prisma.message.findFirst({
          where: { conversationId: conversation.id },
          orderBy: { sentAt: "desc" },
        });

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: user.id,
            unread: true,
          },
        });

        // Get online status from connected clients
        const isOnline = Array.from(clients.values()).some(
          (client) => client.userId === user.id
        );

        // Apply filter if needed
        if (filter === "online" && !isOnline) return null;
        if (filter === "unread" && unreadCount === 0) return null;

        return {
          id: conversation.id, // Use conversation ID as the contact ID
          userId: user.id, // Store the actual user ID
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          avatar: user.image || "/placeholder.svg?height=40&width=40",
          status: isOnline ? "online" : "offline",
          lastMessage: lastMessage?.content || "Start a conversation...",
          lastMessageTime: lastMessage
            ? formatMessageTime(lastMessage.sentAt)
            : "No messages",
          unread: unreadCount,
        };
      })
    );

    // Filter out null values and send response
    res.json(contactsWithDetails.filter(Boolean));
  } catch (error) {
    console.error("Error searching contacts:", error);
    res.status(500).json({ error: "Failed to search contacts" });
  }
});

// Helper function to format message time
function formatMessageTime(date: Date): string {
  const now = new Date();
  const messageDate = new Date(date);

  // If today, show time
  if (messageDate.toDateString() === now.toDateString()) {
    // @ts-ignore
    return format(messageDate, "h:mm a");
  }

  // If yesterday, show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  // If within a week, show day name
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  if (messageDate > weekAgo) {
    // @ts-ignore
    return format(messageDate, "EEEE"); // Day name
  }

  // Otherwise show date
  // @ts-ignore
  return format(messageDate, "MMM d");
}

// Helper function to broadcast to all clients
function broadcastMessage(message: ServerMessage) {
  const messageStr = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

// Helper function to broadcast user status changes
function broadcastUserStatus(message: UserStatusMessage) {
  const messageStr = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

// Helper function to broadcast to a specific room
function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
  const roomParticipants = rooms.get(roomId);
  if (!roomParticipants) return;

  const messageStr = JSON.stringify(message);

  clients.forEach((client) => {
    if (
      client.ws.readyState === WebSocket.OPEN &&
      roomParticipants.has(client.userId) &&
      (!excludeUserId || client.userId !== excludeUserId)
    ) {
      client.ws.send(messageStr);
    }
  });
}

// Helper function to broadcast to conversation members
async function broadcastToConversation(conversationId: string, message: any) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return;

    const messageStr = JSON.stringify(message);

    clients.forEach((client) => {
      if (
        client.ws.readyState === WebSocket.OPEN &&
        conversation.participants.includes(client.userId)
      ) {
        client.ws.send(messageStr);
      }
    });
  } catch (error) {
    console.error("Error broadcasting to conversation:", error);
  }
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds} sec`;
  } else {
    return `${minutes} min ${remainingSeconds} sec`;
  }
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("WebSocket server is running");
});
