import { socketService } from "./socket";

interface PeerConnection {
  connection: RTCPeerConnection;
  streams: MediaStream[];
}

type MediaAvailability = {
  video: boolean;
  audio: boolean;
};

export class VideoCallService {
  private roomId: string | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private userId: string | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
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
  private mediaAvailability: MediaAvailability = { video: true, audio: true };
  private socketListenerRemover: (() => void) | null = null;

  constructor() {
    // Add WebSocket message listener
    this.socketListenerRemover = socketService.addMessageListener(
      this.handleSocketMessage
    );
  }

  // Initialize a call
  async initializeCall(
    userId: string,
    roomId: string,
    conversationId: string,
    mediaConstraints: MediaStreamConstraints = { audio: true, video: true }
  ): Promise<MediaStream> {
    this.userId = userId;
    this.roomId = roomId;

    // Clean up any existing connections
    this.cleanup();

    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );

      // Update media availability
      this.mediaAvailability = {
        video: !!mediaConstraints.video,
        audio: !!mediaConstraints.audio,
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
    roomId: string,
    mediaConstraints: MediaStreamConstraints = { audio: true, video: true }
  ): Promise<MediaStream> {
    this.userId = userId;
    this.roomId = roomId;

    // Clean up any existing connections
    this.cleanup();

    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );

      // Update media availability
      this.mediaAvailability = {
        video: !!mediaConstraints.video,
        audio: !!mediaConstraints.audio,
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
    const newState = !this.mediaAvailability.video;

    if (videoTracks.length > 0) {
      videoTracks.forEach((track) => {
        track.enabled = newState;
      });

      this.mediaAvailability.video = newState;
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

        this.mediaAvailability.video = true;
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
    const newState = !this.mediaAvailability.audio;

    if (audioTracks.length > 0) {
      audioTracks.forEach((track) => {
        track.enabled = newState;
      });

      this.mediaAvailability.audio = newState;
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
      return false;
    }

    // Start screen sharing
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      this.screenStream = screenStream;

      // Add screen tracks to all peer connections
      screenStream.getTracks().forEach((track) => {
        track.onended = () => {
          this.toggleScreenSharing();
        };

        this.peerConnections.forEach(({ connection }) => {
          connection.addTrack(track, screenStream);
        });
      });

      return true;
    } catch (error) {
      console.error("Error starting screen sharing:", error);
      return false;
    }
  }

  // End the call
  endCall(): void {
    if (!this.roomId || !this.userId) return;

    // Send call end signal
    socketService.sendCallSignal("call-end", this.roomId, this.userId, {});

    // Leave the room
    socketService.leaveRoom(this.userId, this.roomId);

    this.cleanup();

    // Notify call ended
    this.notifyCallEnded();
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
  }

  // Get call status
  getCallStatus(): {
    inCall: boolean;
    roomId: string | null;
    mediaAvailability: MediaAvailability;
    participantCount: number;
  } {
    return {
      inCall: !!this.roomId,
      roomId: this.roomId,
      mediaAvailability: { ...this.mediaAvailability },
      participantCount: this.peerConnections.size,
    };
  }

  // Register callbacks for streams
  onStreamAdded(callback: (userId: string, stream: MediaStream) => void): void {
    this.onStreamAddedCallbacks.push(callback);
  }

  onStreamRemoved(callback: (userId: string) => void): void {
    this.onStreamRemovedCallbacks.push(callback);
  }

  onParticipantJoined(
    callback: (userId: string, username: string) => void
  ): void {
    this.onParticipantJoinedCallbacks.push(callback);
  }

  onParticipantLeft(callback: (userId: string) => void): void {
    this.onParticipantLeftCallbacks.push(callback);
  }

  onCallEnded(callback: () => void): void {
    this.onCallEndedCallbacks.push(callback);
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

// Singleton instance
export const videoCallService = new VideoCallService();
