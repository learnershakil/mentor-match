import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

// Types to match backend types
export interface ChatMessage {
  type: "message";
  id: string;
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

export interface UserStatusMessage {
  type: "userStatus";
  userId: string;
  status: "online" | "offline" | "away";
}

export interface CallSignalingMessage {
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

export interface CallInvitationMessage {
  type: "callInvitation";
  id: string;
  roomId: string;
  callSessionId: string;
  creatorId: string;
  creatorName: string;
  title: string;
}

export type WebSocketMessage =
  | ChatMessage
  | UserStatusMessage
  | CallSignalingMessage
  | CallInvitationMessage
  | any;

// Event listeners
type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (status: boolean) => void;

// Socket connection states
export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

class SocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private messageListeners: MessageHandler[] = [];
  private statusChangeListeners: StatusHandler[] = [];
  private userId: string | null = null;
  private username: string | null = null;

  constructor() {
    // Use environment variable for WebSocket URL or fallback to localhost
    this.url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
  }

  // Connect to the WebSocket server
  connect(userId: string, username: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.userId = userId;
      this.username = username;

      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      // Close existing socket if any
      if (this.socket) {
        this.socket.close();
      }

      // Create new socket
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log("WebSocket connection established");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyStatusChange(true);

        // Register with the server
        this.sendMessage({
          type: "register",
          userId,
          username,
        });

        resolve(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      this.socket.onclose = (event) => {
        console.log(
          `WebSocket connection closed: ${event.code} - ${event.reason}`
        );
        this.isConnected = false;
        this.notifyStatusChange(false);
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    });
  }

  // Try to reconnect after a connection loss
  private attemptReconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;

    this.reconnectTimeoutId = setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      if (this.userId && this.username) {
        this.connect(this.userId, this.username);
      }
    }, this.reconnectDelay * Math.min(this.reconnectAttempts, 3));
  }

  // Send a message to the server
  sendMessage(message: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return false;
    }

    // Add an ID if not present
    if (!message.id) {
      message.id = uuidv4();
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  // Send a chat message
  sendChatMessage(
    senderId: string,
    conversationId: string,
    text: string,
    receiverId?: string,
    attachments?: any[],
    messageType:
      | "TEXT"
      | "FILE"
      | "CALL_STARTED"
      | "CALL_ENDED"
      | "CALL_MISSED"
      | "SYSTEM" = "TEXT"
  ): string {
    const messageId = uuidv4();

    const message: ChatMessage = {
      type: "message",
      id: messageId,
      senderId,
      conversationId,
      receiverId,
      text,
      timestamp: Date.now(),
      attachments,
      messageType,
    };

    this.sendMessage(message);
    return messageId;
  }

  // Send call signaling data
  sendCallSignal(
    signalType: string,
    roomId: string,
    senderId: string,
    payload: any,
    receiverId?: string
  ): boolean {
    const message: CallSignalingMessage = {
      type: "callSignaling",
      // @ts-ignore
      id: uuidv4(),
      signalType: signalType as any,
      senderId,
      receiverId,
      roomId,
      payload,
    };

    return this.sendMessage(message);
  }

  // Join a video call room
  joinRoom(userId: string, roomId: string): boolean {
    return this.sendMessage({
      type: "joinRoom",
      id: uuidv4(),
      userId,
      roomId,
      username: this.username,
    });
  }

  // Leave a video call room
  leaveRoom(userId: string, roomId: string): boolean {
    return this.sendMessage({
      type: "leaveRoom",
      id: uuidv4(),
      userId,
      roomId,
    });
  }

  // Update user status
  updateStatus(status: "online" | "offline" | "away"): boolean {
    if (!this.userId) return false;

    return this.sendMessage({
      type: "userStatus",
      id: uuidv4(),
      userId: this.userId,
      status,
    });
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage) {
    // Notify all listeners
    this.messageListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        console.error("Error in message listener:", error);
      }
    });
  }

  // Add a message listener
  addMessageListener(listener: MessageHandler): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(
        (l) => l !== listener
      );
    };
  }

  // Add a connection status change listener
  addStatusChangeListener(listener: StatusHandler): () => void {
    this.statusChangeListeners.push(listener);
    return () => {
      this.statusChangeListeners = this.statusChangeListeners.filter(
        (l) => l !== listener
      );
    };
  }

  // Notify status change listeners
  private notifyStatusChange(status: boolean) {
    this.statusChangeListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error("Error in status change listener:", error);
      }
    });
  }

  // Disconnect from the server
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.isConnected = false;
    this.userId = null;
    this.username = null;
  }

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Create a global instance
export const socketService = new SocketService();

// Create a state store for connection status
interface SocketState {
  isConnected: boolean;
  connectionState: ConnectionState;
  userStatuses: Record<string, "online" | "offline" | "away">;
  pendingMessages: Record<string, string[]>; // conversationId -> messageIds[]
  connect: (userId: string, username: string) => Promise<boolean>;
  disconnect: () => void;
  updateUserStatus: (
    userId: string,
    status: "online" | "offline" | "away"
  ) => void;
  addPendingMessage: (conversationId: string, messageId: string) => void;
  removePendingMessage: (conversationId: string, messageId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  isConnected: false,
  connectionState: "disconnected",
  userStatuses: {},
  pendingMessages: {},

  connect: async (userId: string, username: string) => {
    set({ connectionState: "connecting" });

    try {
      const success = await socketService.connect(userId, username);

      // Add status listener
      socketService.addStatusChangeListener((connected) => {
        set({
          isConnected: connected,
          connectionState: connected ? "connected" : "reconnecting",
        });
      });

      // Add message listener for user statuses
      socketService.addMessageListener((message) => {
        if (message.type === "userStatus") {
          set((state) => ({
            userStatuses: {
              ...state.userStatuses,
              [message.userId]: message.status,
            },
          }));
        } else if (message.type === "messageConfirm") {
          // Remove confirmed message from pending
          const { conversationId, originalId } = message;
          if (conversationId && originalId) {
            get().removePendingMessage(conversationId, originalId);
          }
        }
      });

      set({
        isConnected: success,
        connectionState: success ? "connected" : "disconnected",
      });

      return success;
    } catch (error) {
      set({ connectionState: "disconnected" });
      return false;
    }
  },

  disconnect: () => {
    socketService.disconnect();
    set({
      isConnected: false,
      connectionState: "disconnected",
    });
  },

  updateUserStatus: (userId, status) => {
    set((state) => ({
      userStatuses: {
        ...state.userStatuses,
        [userId]: status,
      },
    }));
  },

  addPendingMessage: (conversationId, messageId) => {
    set((state) => {
      const existing = state.pendingMessages[conversationId] || [];
      return {
        pendingMessages: {
          ...state.pendingMessages,
          [conversationId]: [...existing, messageId],
        },
      };
    });
  },

  removePendingMessage: (conversationId, messageId) => {
    set((state) => {
      const existing = state.pendingMessages[conversationId] || [];
      return {
        pendingMessages: {
          ...state.pendingMessages,
          [conversationId]: existing.filter((id) => id !== messageId),
        },
      };
    });
  },
}));
