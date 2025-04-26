"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  ScreenShare,
  Monitor,
  Users,
  Send,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useVideoCallStore } from "@/lib/video-call-service";
import { socketService, useSocketStore } from "@/lib/socket-service";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

interface VideoCallModalProps {
  open: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar: string;
}

export function VideoCallModal({
  open,
  onClose,
  contactName,
  contactAvatar,
}: VideoCallModalProps) {
  const [activeTab, setActiveTab] = useState<"video" | "chat" | "participants">(
    "video"
  );
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callStatus, setCallStatus] = useState<
    "connecting" | "connected" | "ended" | "failed"
  >("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const isConnected = useSocketStore((state) => state.isConnected);
  const userStatuses = useSocketStore((state) => state.userStatuses);

  const {
    isInCall,
    participants,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    startCall,
    joinCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendChatMessage,
    addCallMessage,
  } = useVideoCallStore();

  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const currentUserId = "current-user-id"; // Replace with your auth system's user ID

  // Initialize call when modal opens
  useEffect(() => {
    if (open && !isInCall) {
      setIsCallInProgress(false);
      setCallStatus("connecting");
      setCallDuration(0);

      // In a real implementation, you'd create a call room through the API
      // Here we simulate it for demonstration purposes
      const simulateCallStart = async () => {
        try {
          // Create a new conversation if needed
          const conversationId = "demo-conversation-" + uuidv4().slice(0, 8);
          const randomRoomId = "room-" + uuidv4().slice(0, 8);
          const callSessionId = "call-" + uuidv4();

          setRoomId(randomRoomId);
          setCallSessionId(callSessionId);
          setConversationId(conversationId);

          // Start the call
          const success = await startCall({
            userId: currentUserId,
            username: "You",
            roomId: randomRoomId,
            callSessionId,
            conversationId,
          });

          if (success) {
            setIsCallInProgress(true);
            setCallStatus("connected");

            // Start call timer
            const timer = setInterval(() => {
              setCallDuration((prev) => prev + 1);
            }, 1000);
            setCallTimer(timer);
          } else {
            setCallStatus("failed");
          }
        } catch (error) {
          console.error("Failed to start call:", error);
          setCallStatus("failed");
        }
      };

      // Connect to WebSocket server if not already connected
      if (!isConnected) {
        socketService
          .connect(currentUserId, "You")
          .then(() => simulateCallStart())
          .catch((error) => {
            console.error("Failed to connect to WebSocket server:", error);
            setCallStatus("failed");
          });
      } else {
        simulateCallStart();
      }
    }

    // Clean up when modal closes
    return () => {
      if (callTimer) {
        clearInterval(callTimer);
      }
      
      if (isInCall) {
        endCall();
      }
    };
  }, [open, isInCall, isConnected, startCall, endCall]);

  // Set up video streams when participants change
  useEffect(() => {
    // Get local stream
    const localUser = participants.find((p) => p.userId === currentUserId);
    if (localUser?.streams[0] && localVideoRef.current) {
      localVideoRef.current.srcObject = localUser.streams[0];
    }

    // Set up remote streams
    participants.forEach((participant) => {
      if (participant.userId !== currentUserId && participant.streams.length > 0) {
        const videoEl = remoteVideoRefs.current[participant.userId];
        if (videoEl && participant.streams[0]) {
          videoEl.srcObject = participant.streams[0];
        }
      }
    });
  }, [participants, currentUserId]);

  // Handle ending the call
  const handleEndCall = useCallback(async () => {
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }

    setCallStatus("ended");
    await endCall();
    setIsCallInProgress(false);
    onClose();
  }, [callTimer, endCall, onClose]);

  // Handle sending chat messages
  const handleSendChatMessage = useCallback(() => {
    if (!chatMessage.trim() || !roomId) return;

    sendChatMessage(chatMessage.trim()).then((success) => {
      if (success) {
        const messageObj = {
          id: uuidv4(),
          senderId: currentUserId,
          text: chatMessage.trim(),
          timestamp: Date.now(),
          sender: {
            id: currentUserId,
            firstName: "You",
            lastName: "",
          },
        };

        setChatMessages((prev) => [...prev, messageObj]);
        addCallMessage(messageObj);
        setChatMessage("");
      }
    });
  }, [chatMessage, roomId, sendChatMessage, addCallMessage, currentUserId]);

  // Format call duration for display
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Render empty state when no participants
  const renderEmptyCallState = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center">
        <div className="mb-4">
          <Avatar className="h-20 w-20 mx-auto">
            <AvatarImage src={contactAvatar} alt={contactName} />
            <AvatarFallback>{contactName[0]}</AvatarFallback>
          </Avatar>
        </div>
        <h3 className="text-xl font-medium mb-2">Calling {contactName}...</h3>
        <p className="text-muted-foreground">
          {callStatus === "connecting"
            ? "Connecting..."
            : callStatus === "failed"
            ? "Failed to connect"
            : callStatus === "ended"
            ? "Call ended"
            : "Waiting for answer"}
        </p>
      </div>
    </div>
  );

  // Render participants as video grid
  const renderParticipantVideos = () => {
    const remoteParticipants = participants.filter(
      (p) => p.userId !== currentUserId
    );

    if (remoteParticipants.length === 0) {
      return renderEmptyCallState();
    }

    // Calculate grid layout based on number of participants
    let gridClass = "grid-cols-1";
    if (remoteParticipants.length === 1) {
      gridClass = "grid-cols-1";
    } else if (remoteParticipants.length === 2) {
      gridClass = "grid-cols-2";
    } else if (remoteParticipants.length >= 3) {
      gridClass = "grid-cols-2 md:grid-cols-3";
    }

    return (
      <div className={`grid ${gridClass} gap-4 h-full`}>
        {remoteParticipants.map((participant) => (
          <div
            key={participant.userId}
            className="relative bg-muted rounded-lg overflow-hidden"
          >
            <video
            // @ts-ignore
              ref={(el) => (remoteVideoRefs.current[participant.userId] = el)}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-background/60 rounded-md px-2 py-1 text-sm">
              {participant.username}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Call header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={contactAvatar} alt={contactName} />
                  <AvatarFallback>{contactName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{contactName}</h3>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {isCallInProgress ? (
                      <>
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                        <span>{formatDuration(callDuration)}</span>
                      </>
                    ) : (
                      <span>{callStatus}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onClose()}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Call content */}
            <div className="flex-1 overflow-hidden bg-muted/30 p-4">
              <Tabs
                defaultValue="video"
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as any)}
                className="h-full flex flex-col"
              >
                <TabsList className="mx-auto mb-4">
                  <TabsTrigger value="video">Video</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="participants">
                    Participants{" "}
                    <Badge className="ml-1">{participants.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="video" className="flex-1 relative">
                  {renderParticipantVideos()}

                  {/* Self view (bottom right) */}
                  <div className="absolute bottom-4 right-4 w-36 h-48 bg-muted rounded-lg overflow-hidden border-2 border-background shadow-lg">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!isVideoEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-background/60 rounded-md px-2 py-1 text-xs">
                      You {isMuted && <MicOff className="h-3 w-3 inline" />}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                          <p>No messages yet</p>
                          <p className="text-sm">
                            Start the conversation with {contactName}
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex items-start gap-2 max-w-[80%]",
                              message.senderId === currentUserId
                                ? "ml-auto"
                                : "mr-auto"
                            )}
                          >
                            {message.senderId !== currentUserId && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={contactAvatar}
                                  alt={contactName}
                                />
                                <AvatarFallback>
                                  {contactName[0]}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <div
                                className={cn(
                                  "rounded-lg px-3 py-2",
                                  message.senderId === currentUserId
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}
                              >
                                <p className="text-sm">{message.text}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(
                                  new Date(message.timestamp),
                                  "h:mm a"
                                )}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t mt-auto">
                    <div className="flex gap-2">
                      <Textarea
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="min-h-[60px] flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChatMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendChatMessage}
                        size="icon"
                        disabled={!chatMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="participants" className="flex-1">
                  <ScrollArea className="h-full">
                    <div className="space-y-2 p-4">
                      {participants.map((participant) => (
                        <div
                          key={participant.userId}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {participant.userId === currentUserId ? (
                                <AvatarFallback>You</AvatarFallback>
                              ) : (
                                <>
                                  <AvatarImage
                                    src={contactAvatar}
                                    alt={contactName}
                                  />
                                  <AvatarFallback>
                                    {contactName[0]}
                                  </AvatarFallback>
                                </>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {participant.userId === currentUserId
                                  ? "You"
                                  : participant.username}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {participant.userId === currentUserId
                                  ? "Host"
                                  : "Guest"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!participant.mediaState.audio && (
                              <MicOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            {!participant.mediaState.video && (
                              <VideoOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            {participant.mediaState.screen && (
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* Call controls */}
            <div className="p-4 border-t flex items-center justify-center space-x-4">
              <Button
                variant={isMuted ? "default" : "outline"}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={toggleAudio}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant={isVideoEnabled ? "outline" : "default"}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={toggleVideo}
              >
                {isVideoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant={isScreenSharing ? "default" : "outline"}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={toggleScreenShare}
              >
                {isScreenSharing ? (
                  <Monitor className="h-5 w-5" />
                ) : (
                  <ScreenShare className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

