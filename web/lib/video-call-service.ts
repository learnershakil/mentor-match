import { socketService } from "./socket-service";
import { create } from "zustand";

interface PeerConnection {
  connection: RTCPeerConnection;
  streams: MediaStream[];
}

export type MediaState = {
  video: boolean;
  audio: boolean;
  screen: boolean;
};

export type Participant = {
  userId: string;
  username: string;
  streams: MediaStream[];
  mediaState: MediaState;
};

class VideoCallService {
  private roomId: string | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private userId: string | null = null;
  private username: string | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Add TURN servers for production
    // {
    //   urls: 'turn:your-turn-server.com',
    //   username: 'username',
    //   credential: 'credential'
    // }
  ];
  private onStreamAddedCallbacks: ((
    userId: string,
    stream: MediaStream
  ) => void)[] = [];
  private onStreamRemovedCallbacks: ((userId: string) => void)[] = [];
  private onParticipantJoinedCallbacks: ((
    userId: string,
    username: string
  ) => void)[] = [];
  private onParticipantLeftCallbacks: ((userId: string) => void)[] = [];
  private onCallEndedCallbacks: (() => void)[] = [];
  private mediaState: MediaState = { video: true, audio: true, screen: false };
  private socketListenerRemover: (() => void) | null = null;
  private callSessionId: string | null = null;
  private conversationId: string | null = null;

  constructor() {
    // Add WebSocket message listener
    this.socketListenerRemover = socketService.addMessageListener(
      this.handleSocketMessage
    );
  }

  // Initialize a call as host
  async initializeCall(
    userId: string,
    username: string,
    roomId: string,
    callSessionId: string,
    conversationId: string,
    mediaConstraints: MediaStreamConstraints = { audio: true, video: true }
  ): Promise<MediaStream> {
    this.userId = userId;
    this.username = username;
    this.roomId = roomId;
    this.callSessionId = callSessionId;
    this.conversationId = conversationId;

    // Clean up any existing connections
    this.cleanup();

    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );

      // Update media state
      this.mediaState = {
        video: !!mediaConstraints.video,
        audio: !!mediaConstraints.audio,
        screen: false,
      };

      // Send call start signal
      socketService.sendCallSignal("call-start", roomId, userId, {
        conversationId,
      });

      // Join the room
      socketService.joinRoom(userId, roomId);

      return this.localStream;
    } catch (error) {
      console.error("Error initializing call:", error);
      throw error;
    }
  }

  // Join an existing call
  async joinCall(
    userId: string,
    username: string,
    roomId: string,
    callSessionId: string,
    conversationId: string,
    mediaConstraints: MediaStreamConstraints = { audio: true, video: true }
  ): Promise<MediaStream> {
    this.userId = userId;
    this.username = username;
    this.roomId = roomId;
    this.callSessionId = callSessionId;
    this.conversationId = conversationId;

    // Clean up any existing connections
    this.cleanup();

    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );

      // Update media state
      this.mediaState = {
        video: !!mediaConstraints.video,
        audio: !!mediaConstraints.audio,
        screen: false,
      };

      // Join the room
      socketService.joinRoom(userId, roomId);

      return this.localStream;
    } catch (error) {
      console.error("Error joining call:", error);
      throw error;
    }
  }

  // Handle socket messages
  private handleSocketMessage = async (message: any) => {
    if (!this.roomId || !this.userId) return;

    // Handle call signaling messages
    if (message.type === "callSignaling" && message.roomId === this.roomId) {
      switch (message.signalType) {
        case "offer":
          await this.handleOffer(message.senderId, message.payload);
          break;
        case "answer":
          await this.handleAnswer(message.senderId, message.payload);
          break;
        case "ice-candidate":
          this.handleIceCandidate(message.senderId, message.payload);
          break;
        case "call-end":
          this.handleCallEnd();
          break;
        case "user-joined":
          // This is handled by the userJoined message type
          break;
        case "user-left":
          // This is handled by the userLeft message type
          break;
      }
    }

    // Handle user joined/left messages
    else if (
      message.type === "userJoined" &&
      message.roomId === this.roomId &&
      message.userId !== this.userId
    ) {
      await this.handleUserJoined(message.userId, message.username);
    } else if (message.type === "userLeft" && message.roomId === this.roomId) {
      this.handleUserLeft(message.userId);
    } else if (message.type === "callEnded" && message.roomId === this.roomId) {
      this.handleCallEnd();
    }
  };

  // Create a peer connection for a user
  private async createPeerConnection(
    remoteUserId: string
  ): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Add local streams to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.screenStream!);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendCallSignal(
          "ice-candidate",
          this.roomId!,
          this.userId!,
          event.candidate,
          remoteUserId
        );
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Connection state for ${remoteUserId}:`,
        peerConnection.connectionState
      );

      if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed"
      ) {
        this.handleUserLeft(remoteUserId);
      }
    };

    // Handle track event to get remote streams
    peerConnection.ontrack = (event) => {
      const streams = event.streams;
      if (streams.length > 0) {
        const existingPC = this.peerConnections.get(remoteUserId);
        if (existingPC) {
          // Check if this stream is already known
          const isNewStream = !existingPC.streams.some(
            (s) => s.id === streams[0].id
          );

          if (isNewStream) {
            existingPC.streams.push(streams[0]);
            this.notifyStreamAdded(remoteUserId, streams[0]);
          }
        } else {
          this.peerConnections.set(remoteUserId, {
            connection: peerConnection,
            streams: [streams[0]],
          });
          this.notifyStreamAdded(remoteUserId, streams[0]);
        }
      }
    };

    this.peerConnections.set(remoteUserId, {
      connection: peerConnection,
      streams: [],
    });

    return peerConnection;
  }

  // Handle a new user joining the call
  private async handleUserJoined(
    userId: string,
    username: string
  ): Promise<void> {
    console.log(`User joined: ${username} (${userId})`);

    // Notify about the new participant
    this.notifyParticipantJoined(userId, username);

    // Create a peer connection and send an offer
    try {
      const peerConnection = await this.createPeerConnection(userId);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socketService.sendCallSignal(
        "offer",
        this.roomId!,
        this.userId!,
        offer,
        userId
      );
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  // Handle a user leaving the call
  private handleUserLeft(userId: string): void {
    console.log(`User left: ${userId}`);

    // Close peer connection
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.connection.close();
      this.peerConnections.delete(userId);

      // Notify about stream removal
      this.notifyStreamRemoved(userId);

      // Notify about participant leaving
      this.notifyParticipantLeft(userId);
    }
  }

  // Handle an offer from another user
  private async handleOffer(
    senderId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    try {
      const peerConnection = await this.createPeerConnection(senderId);

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketService.sendCallSignal(
        "answer",
        this.roomId!,
        this.userId!,
        answer,
        senderId
      );
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  // Handle an answer to our offer
  private async handleAnswer(
    senderId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(senderId)?.connection;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }

  // Handle an ICE candidate from another user
  private handleIceCandidate(
    senderId: string,
    candidate: RTCIceCandidateInit
  ): void {
    try {
      const peerConnection = this.peerConnections.get(senderId)?.connection;
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  // Handle the end of a call
  private handleCallEnd(): void {
    console.log("Call ended");

    this.cleanup();

    // Notify call ended
    this.notifyCallEnded();
  }

  // Toggle local video
  async toggleVideo(): Promise<boolean> {
    if (!this.localStream) return false;

    const videoTracks = this.localStream.getVideoTracks();
    const newState = !this.mediaState.video;

    if (videoTracks.length > 0) {
      videoTracks.forEach((track) => {
        track.enabled = newState;
      });

      this.mediaState.video = newState;

      // Notify peers about state change if needed
      if (this.roomId) {
        socketService.sendCallSignal(
          "media-state-change",
          this.roomId,
          this.userId!,
          { video: newState }
        );
      }

      return newState;
    } else if (newState) {
      // Try to add video track if it doesn't exist and is being enabled
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const videoTrack = videoStream.getVideoTracks()[0];

        this.localStream.addTrack(videoTrack);

        // Add this track to all peer connections
        this.peerConnections.forEach(({ connection }) => {
          connection.addTrack(videoTrack, this.localStream!);
        });

        this.mediaState.video = true;

        // Notify peers about state change
        if (this.roomId) {
          socketService.sendCallSignal(
            "media-state-change",
            this.roomId,
            this.userId!,
            { video: true }
          );
        }

        return true;
      } catch (error) {
        console.error("Could not add video track:", error);
        return false;
      }
    }

    return false;
  }

  // Toggle local audio
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTracks = this.localStream.getAudioTracks();
    const newState = !this.mediaState.audio;

    if (audioTracks.length > 0) {
      audioTracks.forEach((track) => {
        track.enabled = newState;
      });

      this.mediaState.audio = newState;

      // Notify peers about state change
      if (this.roomId) {
        socketService.sendCallSignal(
          "media-state-change",
          this.roomId,
          this.userId!,
          { audio: newState }
        );
      }

      return newState;
    }

    return false;
  }

  // Toggle screen sharing
  async toggleScreenSharing(): Promise<boolean> {
    // If already sharing screen, stop it
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        track.stop();

        // Remove screen share tracks from all peer connections
        this.peerConnections.forEach(({ connection }) => {
          connection.getSenders().forEach((sender) => {
            if (sender.track && sender.track.id === track.id) {
              connection.removeTrack(sender);
            }
          });
        });
      });

      this.screenStream = null;
      this.mediaState.screen = false;

      // Notify peers
      if (this.roomId) {
        socketService.sendCallSignal(
          "media-state-change",
          this.roomId,
          this.userId!,
          { screen: false }
        );
      }

      return false;
    }

    // Start screen sharing
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      this.screenStream = screenStream;
      this.mediaState.screen = true;

      // Add screen tracks to all peer connections
      screenStream.getTracks().forEach((track) => {
        track.onended = () => {
          this.toggleScreenSharing();
        };

        this.peerConnections.forEach(({ connection }) => {
          connection.addTrack(track, screenStream);
        });
      });

      // Notify peers
      if (this.roomId) {
        socketService.sendCallSignal(
          "media-state-change",
          this.roomId,
          this.userId!,
          { screen: true }
        );
      }

      return true;
    } catch (error) {
      console.error("Error starting screen sharing:", error);
      return false;
    }
  }

  // Send a text chat message during the call
  sendChatMessage(text: string): Promise<boolean> {
    if (!this.roomId || !this.userId || !this.conversationId || !text.trim()) {
      return Promise.resolve(false);
    }

    try {
      return fetch(`/api/video-rooms/${this.roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: this.userId,
          text: text.trim(),
          conversationId: this.conversationId,
        }),
      })
        .then((response) => response.ok)
        .catch((error) => {
          console.error("Error sending chat message:", error);
          return false;
        });
    } catch (error) {
      console.error("Error sending chat message:", error);
      return Promise.resolve(false);
    }
  }

  // End the call
  async endCall(): Promise<boolean> {
    if (!this.roomId || !this.userId || !this.conversationId) return false;

    try {
      // Call the API to end the call
      const response = await fetch(`/api/video-rooms/${this.roomId}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.userId,
          conversationId: this.conversationId,
        }),
      });

      if (response.ok) {
        // Send call end signal via WebSocket
        socketService.sendCallSignal("call-end", this.roomId, this.userId, {
          conversationId: this.conversationId,
        });

        // Leave the room
        socketService.leaveRoom(this.userId, this.roomId);

        this.cleanup();

        // Notify call ended
        this.notifyCallEnded();

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error ending call:", error);
      return false;
    }
  }

  // Get all active streams (including local stream)
  getAllStreams(): MediaStream[] {
    const streams: MediaStream[] = [];

    if (this.localStream) {
      streams.push(this.localStream);
    }

    if (this.screenStream) {
      streams.push(this.screenStream);
    }

    this.peerConnections.forEach(({ streams: peerStreams }) => {
      streams.push(...peerStreams);
    });

    return streams;
  }

  // Get all participants (including local user)
  getParticipants(): Participant[] {
    const participants: Participant[] = [];

    // Add local user
    if (this.userId && this.username) {
      participants.push({
        userId: this.userId,
        username: this.username,
        streams: this.localStream ? [this.localStream] : [],
        mediaState: { ...this.mediaState },
      });
    }

    // Add remote participants
    this.peerConnections.forEach(({ streams }, userId) => {
      participants.push({
        userId,
        username: `User ${userId.substring(0, 5)}`, // This should be improved
        streams,
        mediaState: { video: true, audio: true, screen: false }, // This should be tracked per user
      });
    });

    return participants;
  }

  // Clean up resources
  private cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach(({ connection }) => {
      connection.close();
    });
    this.peerConnections.clear();

    // Stop local streams
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Reset media state
    this.mediaState = { video: true, audio: true, screen: false };
  }

  // Get call status
  getCallStatus(): {
    inCall: boolean;
    roomId: string | null;
    callSessionId: string | null;
    conversationId: string | null;
    mediaState: MediaState;
    participantCount: number;
  } {
    return {
      inCall: !!this.roomId,
      roomId: this.roomId,
      callSessionId: this.callSessionId,
      conversationId: this.conversationId,
      mediaState: { ...this.mediaState },
      participantCount: this.peerConnections.size + 1, // +1 for self
    };
  }

  // Register callbacks for streams
  onStreamAdded(
    callback: (userId: string, stream: MediaStream) => void
  ): () => void {
    this.onStreamAddedCallbacks.push(callback);
    return () => {
      this.onStreamAddedCallbacks = this.onStreamAddedCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onStreamRemoved(callback: (userId: string) => void): () => void {
    this.onStreamRemovedCallbacks.push(callback);
    return () => {
      this.onStreamRemovedCallbacks = this.onStreamRemovedCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onParticipantJoined(
    callback: (userId: string, username: string) => void
  ): () => void {
    this.onParticipantJoinedCallbacks.push(callback);
    return () => {
      this.onParticipantJoinedCallbacks =
        this.onParticipantJoinedCallbacks.filter((cb) => cb !== callback);
    };
  }

  onParticipantLeft(callback: (userId: string) => void): () => void {
    this.onParticipantLeftCallbacks.push(callback);
    return () => {
      this.onParticipantLeftCallbacks = this.onParticipantLeftCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onCallEnded(callback: () => void): () => void {
    this.onCallEndedCallbacks.push(callback);
    return () => {
      this.onCallEndedCallbacks = this.onCallEndedCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Notify about events
  private notifyStreamAdded(userId: string, stream: MediaStream): void {
    this.onStreamAddedCallbacks.forEach((callback) => {
      try {
        callback(userId, stream);
      } catch (error) {
        console.error("Error in stream added callback:", error);
      }
    });
  }

  private notifyStreamRemoved(userId: string): void {
    this.onStreamRemovedCallbacks.forEach((callback) => {
      try {
        callback(userId);
      } catch (error) {
        console.error("Error in stream removed callback:", error);
      }
    });
  }

  private notifyParticipantJoined(userId: string, username: string): void {
    this.onParticipantJoinedCallbacks.forEach((callback) => {
      try {
        callback(userId, username);
      } catch (error) {
        console.error("Error in participant joined callback:", error);
      }
    });
  }

  private notifyParticipantLeft(userId: string): void {
    this.onParticipantLeftCallbacks.forEach((callback) => {
      try {
        callback(userId);
      } catch (error) {
        console.error("Error in participant left callback:", error);
      }
    });
  }

  private notifyCallEnded(): void {
    this.onCallEndedCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error in call ended callback:", error);
      }
    });
  }

  // Dispose resources
  dispose(): void {
    this.cleanup();

    if (this.socketListenerRemover) {
      this.socketListenerRemover();
      this.socketListenerRemover = null;
    }

    this.onStreamAddedCallbacks = [];
    this.onStreamRemovedCallbacks = [];
    this.onParticipantJoinedCallbacks = [];
    this.onParticipantLeftCallbacks = [];
    this.onCallEndedCallbacks = [];
  }
}

// Create a singleton instance
export const videoCallService = new VideoCallService();

// Create a state store for video calls
interface VideoCallState {
  isInCall: boolean;
  roomId: string | null;
  callSessionId: string | null;
  localStream: MediaStream | null;
  participants: Participant[];
  mediaState: MediaState;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  callMessages: any[];

  startCall: (params: {
    userId: string;
    username: string;
    roomId: string;
    callSessionId: string;
    conversationId: string;
  }) => Promise<boolean>;

  joinCall: (params: {
    userId: string;
    username: string;
    roomId: string;
    callSessionId: string;
    conversationId: string;
  }) => Promise<boolean>;

  endCall: () => Promise<boolean>;
  toggleAudio: () => boolean;
  toggleVideo: () => Promise<boolean>;
  toggleScreenShare: () => Promise<boolean>;
  sendChatMessage: (text: string) => Promise<boolean>;
  addCallMessage: (message: any) => void;
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  isInCall: false,
  roomId: null,
  callSessionId: null,
  localStream: null,
  participants: [],
  mediaState: { video: true, audio: true, screen: false },
  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,
  callMessages: [],

  startCall: async ({
    userId,
    username,
    roomId,
    callSessionId,
    conversationId,
  }) => {
    try {
      const stream = await videoCallService.initializeCall(
        userId,
        username,
        roomId,
        callSessionId,
        conversationId
      );

      const callStatus = videoCallService.getCallStatus();

      videoCallService.onParticipantJoined((userId, username) => {
        set((state) => ({
          participants: [
            ...state.participants.filter((p) => p.userId !== userId),
            {
              userId,
              username,
              streams: [],
              mediaState: { video: true, audio: true, screen: false },
            },
          ],
        }));
      });

      videoCallService.onStreamAdded((userId, stream) => {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.userId === userId ? { ...p, streams: [...p.streams, stream] } : p
          ),
        }));
      });

      videoCallService.onParticipantLeft((userId) => {
        set((state) => ({
          participants: state.participants.filter((p) => p.userId !== userId),
        }));
      });

      videoCallService.onCallEnded(() => {
        set({
          isInCall: false,
          roomId: null,
          callSessionId: null,
          localStream: null,
          participants: [],
          isMuted: false,
          isVideoEnabled: true,
          isScreenSharing: false,
        });
      });

      set({
        isInCall: true,
        roomId,
        callSessionId,
        localStream: stream,
        mediaState: callStatus.mediaState,
        participants: [
          {
            userId,
            username,
            streams: [stream],
            mediaState: callStatus.mediaState,
          },
        ],
      });

      return true;
    } catch (error) {
      console.error("Error starting call:", error);
      return false;
    }
  },

  joinCall: async ({
    userId,
    username,
    roomId,
    callSessionId,
    conversationId,
  }) => {
    try {
      const stream = await videoCallService.joinCall(
        userId,
        username,
        roomId,
        callSessionId,
        conversationId
      );

      const callStatus = videoCallService.getCallStatus();

      videoCallService.onParticipantJoined((userId, username) => {
        set((state) => ({
          participants: [
            ...state.participants.filter((p) => p.userId !== userId),
            {
              userId,
              username,
              streams: [],
              mediaState: { video: true, audio: true, screen: false },
            },
          ],
        }));
      });

      videoCallService.onStreamAdded((userId, stream) => {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.userId === userId ? { ...p, streams: [...p.streams, stream] } : p
          ),
        }));
      });

      videoCallService.onParticipantLeft((userId) => {
        set((state) => ({
          participants: state.participants.filter((p) => p.userId !== userId),
        }));
      });

      videoCallService.onCallEnded(() => {
        set({
          isInCall: false,
          roomId: null,
          callSessionId: null,
          localStream: null,
          participants: [],
          isMuted: false,
          isVideoEnabled: true,
          isScreenSharing: false,
        });
      });

      set({
        isInCall: true,
        roomId,
        callSessionId,
        localStream: stream,
        mediaState: callStatus.mediaState,
        participants: [
          {
            userId,
            username,
            streams: [stream],
            mediaState: callStatus.mediaState,
          },
        ],
      });

      return true;
    } catch (error) {
      console.error("Error joining call:", error);
      return false;
    }
  },

  endCall: async () => {
    const success = await videoCallService.endCall();

    if (success) {
      set({
        isInCall: false,
        roomId: null,
        callSessionId: null,
        localStream: null,
        participants: [],
        isMuted: false,
        isVideoEnabled: true,
        isScreenSharing: false,
      });
    }

    return success;
  },

  toggleAudio: () => {
    const newState = videoCallService.toggleAudio();
    set((state) => ({
      isMuted: !newState,
      mediaState: { ...state.mediaState, audio: newState },
    }));
    return newState;
  },

  toggleVideo: async () => {
    const newState = await videoCallService.toggleVideo();
    set((state) => ({
      isVideoEnabled: newState,
      mediaState: { ...state.mediaState, video: newState },
    }));
    return newState;
  },

  toggleScreenShare: async () => {
    const newState = await videoCallService.toggleScreenSharing();
    set((state) => ({
      isScreenSharing: newState,
      mediaState: { ...state.mediaState, screen: newState },
    }));
    return newState;
  },

  sendChatMessage: async (text) => {
    return videoCallService.sendChatMessage(text);
  },

  addCallMessage: (message) => {
    set((state) => ({
      callMessages: [...state.callMessages, message],
    }));
  },
}));
