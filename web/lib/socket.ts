import { v4 as uuidv4 } from "uuid";

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

export type WebSocketMessage =
  | ChatMessage
  | UserStatusMessage
  | CallSignalingMessage
  | any;

// Event listeners
type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private messageListeners: MessageHandler[] = [];
  private statusChangeListeners: ((status: boolean) => void)[] = [];
  private userId: string | null = null;
  private username: string | null = null;

  constructor(url: string = "ws://localhost:8080") {
    this.url = url;
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

      this.socket.onclose = () => {
        console.log("WebSocket connection closed");
        this.isConnected = false;
        this.notifyStatusChange(false);
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.isConnected = false;
        this.notifyStatusChange(false);
      };
    });
  }

  // Reconnect to the server
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
    }, this.reconnectDelay * this.reconnectAttempts);
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
    attachments?: any[]
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
      messageType: attachments && attachments.length > 0 ? "FILE" : "TEXT",
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

  // Join a call room
  joinRoom(userId: string, roomId: string): boolean {
    return this.sendMessage({
      type: "joinRoom",
      id: uuidv4(),
      userId,
      roomId,
      username: this.username,
    });
  }

  // Leave a call room
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
  addStatusChangeListener(listener: (status: boolean) => void): () => void {
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

// Export singleton instance
export const socketService = new WebSocketService();
