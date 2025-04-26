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

export interface SocketMessage {
  type: string;
  [key: string]: any;
}

// Socket service for real-time communication
class SocketService {
  private socket: WebSocket | null = null;
  private messageListeners: ((message: any) => void)[] = [];
  private userId: string | null = null;
  private userName: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Initialize the socket connection
  initialize(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
    this.connect();
  }

  // Connect to the WebSocket server
  connect() {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("WebSocket connected");

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;

        // Register the user
        this.send({
          type: "register",
          userId: this.userId,
          username: this.userName,
        });

        // Update connection state in store
        useSocketStore.setState({
          isConnected: true,
          connectionState: "connected",
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Process user status updates
          if (message.type === "userStatus") {
            const { userId, status } = message;
            useSocketStore.setState((state) => ({
              userStatuses: {
                ...state.userStatuses,
                [userId]: status,
              },
            }));
          }

          // Notify all listeners
          this.messageListeners.forEach((listener) => listener(message));
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.socket.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        useSocketStore.setState({
          isConnected: false,
          connectionState: "disconnected",
        });

        // Attempt to reconnect
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        useSocketStore.setState({ connectionState: "error" });
      };
    } catch (error) {
      console.error("Error initializing WebSocket:", error);
      useSocketStore.setState({ connectionState: "error" });
    }
  }

  // Send a message through the WebSocket
  send(message: SocketMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    console.warn("WebSocket not connected, message not sent");
    return false;
  }

  // Send a chat message
  sendChatMessage(
    senderId: string,
    conversationId: string,
    content: string,
    receiverId?: string,
    messageType: string = "TEXT"
  ) {
    return this.send({
      type: "message",
      senderId,
      conversationId,
      receiverId,
      content,
      messageType,
      timestamp: Date.now(),
    });
  }

  // Send a typing indicator
  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    return this.send({
      type: "typing",
      userId: this.userId,
      conversationId,
      isTyping,
    });
  }

  // Add a message listener
  addMessageListener(callback: (message: any) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  // Attempt to reconnect
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      useSocketStore.setState({ connectionState: "reconnecting" });

      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      useSocketStore.setState({ connectionState: "failed" });
      console.error("Maximum reconnect attempts reached");
    }
  }

  // Disconnect the socket
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.userId = null;
    this.userName = null;
    this.reconnectAttempts = 0;
    useSocketStore.setState({
      isConnected: false,
      connectionState: "disconnected",
      userStatuses: {},
    });
  }
}

// Create a singleton instance
export const socketService = new SocketService();

// Zustand store for socket state
interface SocketState {
  isConnected: boolean;
  connectionState:
    | "connecting"
    | "connected"
    | "disconnected"
    | "reconnecting"
    | "error"
    | "failed";
  userStatuses: Record<string, "online" | "offline" | "away">;
  connect: (userId: string, userName: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  connectionState: "disconnected",
  userStatuses: {},
  connect: (userId: string, userName: string) => {
    set({ connectionState: "connecting" });
    socketService.initialize(userId, userName);
  },
  disconnect: () => {
    socketService.disconnect();
  },
}));
