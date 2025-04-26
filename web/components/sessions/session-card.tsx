"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Mic,
  MicOff,
  Monitor,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { format, isToday, isTomorrow, isAfter } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RescheduleSessionDialog } from "@/components/sessions/reschedule-session-dialog";
import { toast } from "sonner";

interface Session {
  id: string | number;
  title: string;
  description?: string;
  mentor?: {
    name: string;
    image?: string;
  };
  student?: {
    name: string;
    image?: string;
  };
  date?: string | Date;
  time?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  status:
    | "upcoming"
    | "completed"
    | "cancelled"
    | "scheduled"
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED";
  joinUrl?: string;
  category?: string;
  notes?: string; // Added field for session notes
  recordingUrl?: string; // Added field for recording URL
}

interface SessionCardProps {
  session: Session;
  userRole?: "STUDENT" | "MENTOR";
}

export function SessionCard({
  session,
  userRole = "STUDENT",
}: SessionCardProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string }[]
  >([{ sender: "system", text: "Session chat started" }]);
  const [messageInput, setMessageInput] = useState("");

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const mentorVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startCall = () => {
    setIsCallActive(true);

    // Initialize user video after a short delay
    setTimeout(() => {
      if (userVideoRef.current && navigator.mediaDevices) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            if (userVideoRef.current) {
              userVideoRef.current.srcObject = stream;
            }

            // Simulate mentor video (using the same stream for demo)
            if (mentorVideoRef.current) {
              mentorVideoRef.current.srcObject = stream;
            }
          })
          .catch((err) => console.error("Error accessing camera:", err));
      }
    }, 500);
  };

  const endCall = () => {
    // Stop all tracks from the stream
    if (userVideoRef.current && userVideoRef.current.srcObject) {
      const stream = userVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    setIsCallActive(false);
    setIsMicOn(true);
    setIsVideoOn(true);
    setIsScreenSharing(false);
  };

  const toggleScreenShare = () => {
    if (!isScreenSharing) {
      // Start screen sharing
      if (
        navigator.mediaDevices &&
        "getDisplayMedia" in navigator.mediaDevices
      ) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true })
          .then((stream) => {
            if (screenShareRef.current) {
              const videoElement = document.createElement("video");
              videoElement.srcObject = stream;
              videoElement.autoplay = true;
              videoElement.className = "h-full w-full object-contain";

              // Clear previous content
              if (screenShareRef.current.firstChild) {
                screenShareRef.current.removeChild(
                  screenShareRef.current.firstChild
                );
              }

              screenShareRef.current.appendChild(videoElement);
              setIsScreenSharing(true);

              // Listen for the end of screen sharing
              stream.getVideoTracks()[0].onended = () => {
                setIsScreenSharing(false);
              };
            }
          })
          .catch((err) => {
            console.error("Error sharing screen:", err);
            setIsScreenSharing(false);
          });
      }
    } else {
      // Stop screen sharing
      if (screenShareRef.current && screenShareRef.current.firstChild) {
        const videoElement = screenShareRef.current
          .firstChild as HTMLVideoElement;
        if (videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
        screenShareRef.current.removeChild(videoElement);
      }
      setIsScreenSharing(false);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    setChatMessages([...chatMessages, { sender: "you", text: messageInput }]);
    setMessageInput("");

    // Simulate mentor response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: session.mentor?.name || "Mentor",
          text: "Thanks for your message. Let me help you with that.",
        },
      ]);
    }, 1000);
  };

  // Format the date display
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "";

    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isToday(dateObj)) return "Today";
    if (isTomorrow(dateObj)) return "Tomorrow";

    return format(dateObj, "EEEE, MMMM d");
  };

  // Format the time display
  const formatTime = (start?: string | Date, end?: string | Date) => {
    if (session.time) return session.time;

    if (start && end) {
      const startDate = typeof start === "string" ? new Date(start) : start;
      const endDate = typeof end === "string" ? new Date(end) : end;
      return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
    }

    return "";
  };

  // Determine session status badge
  const getStatusBadge = () => {
    const status = session.status.toUpperCase();

    if (status === "UPCOMING" || status === "SCHEDULED") {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;
    } else if (status === "COMPLETED") {
      return <Badge variant="outline">Completed</Badge>;
    } else if (status === "CANCELLED") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }

    return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;
  };

  // Check if the session is joinable (within 15 minutes of start time)
  const isJoinable = () => {
    if (!session.startTime) return false;

    const startTime =
      typeof session.startTime === "string"
        ? new Date(session.startTime)
        : session.startTime;

    const now = new Date();
    const diffInMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);

    return diffInMinutes <= 15 && isAfter(startTime, now);
  };

  // Format date and time for display
  const displayDate = formatDate(session.date || session.startTime);
  const displayTime = formatTime(session.startTime, session.endTime);

  // Get the person info (either mentor or student) based on user role
  const personInfo = userRole === "STUDENT" ? session.mentor : session.student;
  const personType = userRole === "STUDENT" ? "Mentor" : "Student";

  const start = new Date(session.startTime as string);
  const end = new Date(session.endTime as string);
  const isUpcoming = isAfter(start, new Date());
  const isCompleted = isAfter(new Date(), end);
  const sessionToday = isToday(start);

  const formatSessionTime = () => {
    if (isToday(start)) {
      return `Today, ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
    }
    return `${format(start, "MMM d, yyyy")}, ${format(
      start,
      "h:mm a"
    )} - ${format(end, "h:mm a")}`;
  };

  const formatCategory = (category: string) => {
    return category
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const getSessionStatus = () => {
    const normalizedStatus = session.status.toUpperCase();
    if (normalizedStatus === "CANCELLED") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (normalizedStatus === "RESCHEDULED") {
      return <Badge variant="warning">Rescheduled</Badge>;
    }
    if (isCompleted || normalizedStatus === "COMPLETED") {
      return <Badge variant="outline">Completed</Badge>;
    }
    if (sessionToday) {
      return <Badge variant="default">Today</Badge>;
    }
    return <Badge variant="secondary">Upcoming</Badge>;
  };

  const handleJoinSession = () => {
    if (!session.joinUrl) {
      toast.error("No join link available");
      return;
    }
    window.open(session.joinUrl, "_blank");
  };

  const handleViewRecording = () => {
    if (!session.recordingUrl) {
      toast.error("No recording available");
      return;
    }
    window.open(session.recordingUrl, "_blank");
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-6">
            <div className="shrink-0">
              {userRole === "STUDENT" && session.mentor ? (
                <Avatar className="h-16 w-16 border">
                  <AvatarImage
                    src={session.mentor.image || "/placeholder.svg"}
                    alt={session.mentor.name}
                  />
                  <AvatarFallback>
                    {session.mentor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ) : userRole === "MENTOR" && session.student ? (
                <Avatar className="h-16 w-16 border">
                  <AvatarImage
                    src={session.student.image || "/placeholder.svg"}
                    alt={session.student.name}
                  />
                  <AvatarFallback>
                    {session.student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src="/placeholder.svg" alt="Session" />
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg">{session.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatSessionTime()}</span>
                  </div>
                </div>
                <div>{getSessionStatus()}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/5">
                    {formatCategory(session.category || "")}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(start, "h:mm a")} - {format(end, "h:mm a")}
                  </span>
                </div>

                {userRole === "STUDENT" && session.mentor ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Mentor: {session.mentor.name}</span>
                  </div>
                ) : userRole === "MENTOR" && session.student ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Student: {session.student.name}</span>
                  </div>
                ) : null}
              </div>

              {session.description && (
                <div className="text-sm text-muted-foreground pt-2">
                  <p>{session.description}</p>
                </div>
              )}

              {/* Show session notes if available */}
              {session.notes && (
                <div className="text-sm bg-muted/50 p-3 rounded-md mt-3">
                  <div className="font-medium flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span>Session Notes</span>
                  </div>
                  <p className="text-muted-foreground">{session.notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 justify-end p-4 pt-0 pb-4">
          {session.recordingUrl && (
            <Button variant="outline" size="sm" onClick={handleViewRecording}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Recording
            </Button>
          )}

          {isUpcoming && session.joinUrl && (
            <Button onClick={handleJoinSession}>
              <Video className="mr-2 h-4 w-4" />
              Join Session
            </Button>
          )}
        </CardFooter>
      </Card>

      {isCallActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative h-full w-full max-w-7xl overflow-hidden rounded-lg border bg-background p-6 shadow-lg md:h-[90vh] md:w-[90vw]">
            <div className="absolute right-4 top-4 z-10">
              <Button variant="destructive" size="icon" onClick={endCall}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex h-full flex-col md:flex-row">
              {/* Main video area */}
              <div className="relative flex-1">
                {isScreenSharing ? (
                  <div
                    ref={screenShareRef}
                    className="flex h-full w-full items-center justify-center bg-black"
                  >
                    {/* Screen share content will be added here dynamically */}
                    <p className="text-white">Starting screen share...</p>
                  </div>
                ) : (
                  <div className="h-full w-full bg-black">
                    {/* Mentor video (main) */}
                    <video
                      ref={mentorVideoRef}
                      className="h-full w-full object-cover"
                      autoPlay
                      playsInline
                    />
                  </div>
                )}

                {/* User video (small) */}
                <div className="absolute bottom-4 right-4 h-32 w-48 overflow-hidden rounded-lg border-2 border-background bg-muted shadow-lg">
                  {isVideoOn ? (
                    <video
                      ref={userVideoRef}
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>

                {/* Call controls */}
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-background/90 p-2 shadow-lg">
                  <Button
                    variant={isMicOn ? "default" : "destructive"}
                    size="icon"
                    onClick={() => setIsMicOn(!isMicOn)}
                    className="rounded-full"
                  >
                    {isMicOn ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <MicOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant={isVideoOn ? "default" : "destructive"}
                    size="icon"
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className="rounded-full"
                  >
                    {isVideoOn ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <VideoOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant={isScreenSharing ? "destructive" : "default"}
                    size="icon"
                    onClick={toggleScreenShare}
                    className="rounded-full"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={endCall}
                    className="rounded-full px-4"
                  >
                    End Call
                  </Button>
                </div>
              </div>

              {/* Chat sidebar */}
              <div className="mt-4 h-60 w-full border-t md:h-full md:w-80 md:border-l md:border-t-0">
                <div className="flex h-full flex-col p-4">
                  <h3 className="font-medium">Session Chat</h3>

                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto py-4"
                  >
                    <div className="space-y-4">
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex gap-2",
                            message.sender === "you"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          {message.sender !== "you" &&
                            message.sender !== "system" && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={
                                    session.mentor?.image ||
                                    "/placeholder.svg?height=40&width=40"
                                  }
                                  alt={session.mentor?.name || "Mentor"}
                                />
                                <AvatarFallback>
                                  {session.mentor?.name[0] || "M"}
                                </AvatarFallback>
                              </Avatar>
                            )}

                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                              message.sender === "you"
                                ? "bg-primary text-primary-foreground"
                                : message.sender === "system"
                                ? "bg-muted text-center text-xs italic text-muted-foreground"
                                : "bg-muted"
                            )}
                          >
                            {message.text}
                          </div>

                          {message.sender === "you" && (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>You</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendMessage();
                        }
                      }}
                    />
                    <Button size="icon" onClick={sendMessage}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
