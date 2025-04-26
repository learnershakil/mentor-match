"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Clock,
  Edit,
  File,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Reply,
  Search,
  Send,
  SmilePlus,
  Trash,
  Video,
  X,
} from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { MentorDashboardHeader } from "@/components/mentor-dashboard/mentor-dashboard-header";
import { MentorDashboardShell } from "@/components/mentor-dashboard/mentor-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatbotCard } from "@/components/dashboard/chatbot-card";
import { NotificationsButton } from "@/components/dashboard/notifications-button";
import { VideoCallModal } from "@/components/messages/video-call-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { socketService, useSocketStore } from "@/lib/socket-service";
import { useVideoCallStore } from "@/lib/video-call-service";

// Types
interface Contact {
  id: string; // Changed to string to match DB IDs
  userId: string; // Added to store the actual user ID
  name: string;
  role: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}
interface Attachment {
  id: string;
  type: "image" | "file" | "audio";
  url: string;
  name?: string;
  size?: string;
  thumbnailUrl?: string;
}
interface Message {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  createdAt: Date;
  status: "sent" | "delivered" | "read";
  attachments?: Attachment[];
  replyTo?: number;
  edited?: boolean;
}

// Custom hooks for fetching real data
function useContacts(currentUserId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(
    async (query = "", filter = "all") => {
      if (!currentUserId) return;

      setIsLoading(true);
      try {
        // Try to get contacts from API
        const response = await fetch(
          `http://localhost:8080/api/contacts/search?userId=${currentUserId}&query=${encodeURIComponent(
            query
          )}&filter=${filter}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch contacts");
        }

        const data = await response.json();

        // If we got contacts from the API, use them
        if (data && Array.isArray(data) && data.length > 0) {
          setContacts(data);
          setError(null);
        } else {
          // If no contacts were found, use demo data for now
          console.log("No contacts found from API, using demo data");

          // Create some fallback demo contacts for testing
          const demoContacts: Contact[] = [
            {
              id: "demo-conv-1",
              userId: "demo-user-1",
              name: "Emma Wilson",
              role: "Frontend Mentor",
              avatar: "/placeholder.svg?height=40&width=40",
              status: "online",
              lastMessage:
                "Let me know if you have any questions about the React components.",
              lastMessageTime: "10:30 AM",
              unread: 2,
            },
            {
              id: "demo-conv-2",
              userId: "demo-user-2",
              name: "Alex Rivera",
              role: "AI/ML Mentor",
              avatar: "/placeholder.svg?height=40&width=40",
              status: "offline",
              lastMessage:
                "We'll continue with neural networks in our next session.",
              lastMessageTime: "Yesterday",
              unread: 0,
            },
          ];

          // Filter demo contacts if search query exists
          const filteredDemoContacts = query
            ? demoContacts.filter(
                (c) =>
                  c.name.toLowerCase().includes(query.toLowerCase()) ||
                  c.role.toLowerCase().includes(query.toLowerCase())
              )
            : demoContacts;

          setContacts(filteredDemoContacts);
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);

        // Fallback to demo data on error
        const demoContacts: Contact[] = [
          {
            id: "demo-conv-1",
            userId: "demo-user-1",
            name: "Emma Wilson",
            role: "Frontend Mentor",
            avatar: "/placeholder.svg?height=40&width=40",
            status: "online",
            lastMessage:
              "Let me know if you have any questions about the React components.",
            lastMessageTime: "10:30 AM",
            unread: 2,
          },
          {
            id: "demo-conv-2",
            userId: "demo-user-2",
            name: "Alex Rivera",
            role: "AI/ML Mentor",
            avatar: "/placeholder.svg?height=40&width=40",
            status: "offline",
            lastMessage:
              "We'll continue with neural networks in our next session.",
            lastMessageTime: "Yesterday",
            unread: 0,
          },
        ];

        // Filter demo contacts if search query exists
        const filteredDemoContacts = query
          ? demoContacts.filter(
              (c) =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.role.toLowerCase().includes(query.toLowerCase())
            )
          : demoContacts;

        setContacts(filteredDemoContacts);
        setError("Could not connect to server. Using demo data.");
      } finally {
        setIsLoading(false);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    setContacts,
    isLoading,
    error,
    fetchContacts,
  };
}

function useMessages(conversationId: string | null, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/messages/${conversationId}?userId=${currentUserId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      // Transform API messages to match our Message interface
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId === currentUserId ? 0 : msg.sender.id,
        text: msg.content,
        timestamp: format(new Date(msg.sentAt), "h:mm a"),
        createdAt: new Date(msg.sentAt),
        status: msg.readAt
          ? "read"
          : msg.receiverId === currentUserId
          ? "delivered"
          : "sent",
        attachments: msg.attachments?.map((url: string, index: number) => ({
          id: `${msg.id}-attachment-${index}`,
          type: url.match(/\.(jpg|jpeg|png|gif)$/i) ? "image" : "file",
          url,
          name: url.split("/").pop() || "attachment",
        })),
        replyTo: msg.replyToId,
        edited: msg.editedAt !== null,
      }));

      setMessages(formattedMessages);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Add function to send a message
  const sendMessage = async (
    text: string,
    replyToId?: number,
    attachments?: Attachment[]
  ) => {
    if (
      !conversationId ||
      !currentUserId ||
      (!text.trim() && (!attachments || attachments.length === 0))
    )
      return null;

    try {
      // First create a temporary message for immediate display
      const tempId = Date.now();
      const tempMessage: Message = {
        id: tempId,
        senderId: 0, // Current user
        text: text.trim(),
        timestamp: format(new Date(), "h:mm a"),
        createdAt: new Date(),
        status: "sent",
        attachments,
        replyTo: replyToId,
      };

      // Add to UI immediately
      setMessages((prev) => [...prev, tempMessage]);

      // Then send to API
      const formData = new FormData();
      formData.append("senderId", currentUserId);
      formData.append("conversationId", conversationId);
      formData.append("text", text.trim());

      if (replyToId) {
        formData.append("replyToId", String(replyToId));
      }

      if (attachments?.length) {
        // Handle attachment uploads
        // This would depend on your API implementation
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // On success, refresh messages
      fetchMessages();

      return tempMessage;
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove the temp message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      return null;
    }
  };

  return {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
  };
}

// Modified message manager hook to use real data
function useMessagesManager(
  conversationId: string | null,
  currentUserId: string
) {
  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    sendMessage: apiSendMessage,
  } = useMessages(conversationId, currentUserId);

  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    messages.forEach((message) => {
      const date = getMessageDateLabel(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  }, [messages]);

  // Find a message by ID
  const getMessageById = useCallback(
    (id: number) => {
      return messages.find((m) => m.id === id);
    },
    [messages]
  );

  // Send a new message
  const sendMessage = useCallback(
    async (text: string, replyToId?: number, attachments?: Attachment[]) => {
      const sentMessage = await apiSendMessage(text, replyToId, attachments);

      // API will handle persistence, but we'll still simulate typing for demo
      if (sentMessage) {
        // Simulate typing indicator
        setIsTyping(true);

        // Clear typing after some delay
        setTimeout(() => {
          setIsTyping(false);
        }, 1000 + Math.random() * 2000);
      }

      return sentMessage;
    },
    [apiSendMessage]
  );

  // Edit a message - this would need additional API implementation
  const startEditingMessage = useCallback(
    (messageId: number) => {
      const message = messages.find((m) => m.id === messageId);
      if (message && message.senderId === 0) {
        setEditingMessageId(messageId);
        setEditText(message.text);
      }
    },
    [messages]
  );

  const cancelEditingMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditText("");
  }, []);

  const saveEditedMessage = useCallback(() => {
    if (editingMessageId && editText.trim()) {
      // This would need API implementation
      // For now just update UI
      console.log("Edit message", editingMessageId, editText);
      setEditingMessageId(null);
      setEditText("");
    }
  }, [editingMessageId, editText]);

  // Delete a message - this would need additional API implementation
  const deleteMessage = useCallback((messageId: number) => {
    // This would need API implementation
    console.log("Delete message", messageId);
  }, []);

  // Start replying to a message
  const startReplyingToMessage = useCallback((messageId: number) => {
    setReplyingToId(messageId);
  }, []);

  const cancelReplyingToMessage = useCallback(() => {
    setReplyingToId(null);
  }, []);

  return {
    messages,
    groupedMessages,
    isTyping,
    editingMessageId,
    replyingToId,
    editText,
    getMessageById,
    sendMessage,
    startEditingMessage,
    cancelEditingMessage,
    saveEditedMessage,
    setEditText,
    deleteMessage,
    startReplyingToMessage,
    cancelReplyingToMessage,
    isLoading: messagesLoading,
    error: messagesError,
  };
}

// Utility function to get date label
function getMessageDateLabel(date: Date): string {
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "EEEE, MMMM d");
  }
}

// Main component
export default function MentorMessagesPage() {
  // State
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [activeTab, setActiveTab] = useState("all");
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [hasAttachmentOpen, setHasAttachmentOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    []
  );
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [showContactJump, setShowContactJump] = useState(false);
  const [contactScrollPosition, setContactScrollPosition] = useState(0);
  const [isMobileViewOpen, setIsMobileViewOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // For now we'll use a hardcoded current user - in a real app this would come from authentication
  const [currentUser, setCurrentUser] = useState<any>({
    id: "clx6vr7ot0000lm08xwwqfyil", // Use a valid CUID that exists in your database
    firstName: "You",
    lastName: "",
    role: "MENTOR",
    status: "online",
  });

  // Socket state
  const isConnected = useSocketStore((state) => state.isConnected);
  const connectionState = useSocketStore((state) => state.connectionState);
  const userStatuses = useSocketStore((state) => state.userStatuses);
  const connect = useSocketStore((state) => state.connect);

  // Fetch contacts from database
  const {
    contacts,
    setContacts,
    isLoading: contactsLoading,
    error: contactsError,
    fetchContacts,
  } = useContacts(currentUser.id);

  // Refs
  const messagesScrollAreaRef = useRef<HTMLDivElement>(null);
  const contactsScrollAreaRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Derived state
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  // Use custom hook for messages
  const messageManager = useMessagesManager(selectedContactId, currentUser.id);

  // Run search when debounced query changes
  useEffect(() => {
    setIsSearching(true);
    fetchContacts(debouncedSearchQuery, activeTab).finally(() =>
      setIsSearching(false)
    );
  }, [debouncedSearchQuery, activeTab, fetchContacts]);

  // Filter logic is now handled server-side
  const filteredContacts = useMemo(() => contacts, [contacts]);

  // Group contacts by status
  const groupedContacts = useMemo(
    () => ({
      online: filteredContacts.filter((c) => c.status === "online"),
      unread: filteredContacts.filter(
        (c) => c.unread > 0 && c.status !== "online"
      ),
      other: filteredContacts.filter(
        (c) => c.status !== "online" && c.unread === 0
      ),
    }),
    [filteredContacts]
  );

  // Handle tab changes
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      fetchContacts(searchQuery, value);
    },
    [fetchContacts, searchQuery]
  );

  // Handle sending a message
  const handleSendMessage = useCallback(() => {
    if (
      !newMessage.trim() &&
      (!pendingAttachments || pendingAttachments.length === 0)
    )
      return;

    // Generate a local message ID
    const tempId = `temp-${Date.now()}`;

    // Send through WebSocket if connected
    if (isConnected && selectedContactId) {
      socketService.sendChatMessage(
        currentUser.id,
        selectedContactId,
        newMessage,
        contacts.find((c) => c.id === selectedContactId)?.userId
      );
    }

    // Continue with local UI updates
    const sentMessage = messageManager.sendMessage(
      newMessage,
      messageManager.replyingToId || undefined,
      pendingAttachments.length > 0 ? pendingAttachments : undefined
    );

    if (sentMessage) {
      // Clear input and state
      setNewMessage("");
      setPendingAttachments([]);
      messageManager.cancelReplyingToMessage();

      // Update last message for the contact
      if (selectedContactId) {
        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === selectedContactId
              ? {
                  ...contact,
                  lastMessage: newMessage.trim() || "Attachment sent",
                  lastMessageTime: "Just now",
                }
              : contact
          )
        );
      }

      // If scrolled up, show new message indicator
      if (isScrolledUp) {
        setHasNewMessages(true);
      } else {
        // Schedule scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [
    newMessage,
    pendingAttachments,
    messageManager,
    selectedContactId,
    isScrolledUp,
    isConnected,
    currentUser.id,
    contacts,
    setContacts,
  ]);

  // Handle messages scroll
  const handleMessagesScroll = useCallback(() => {
    if (!messagesScrollAreaRef.current) return;
    const container = messagesScrollAreaRef.current;
    const scrollPosition = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    // Check if user has scrolled up
    const isAtBottom = scrollPosition + clientHeight >= scrollHeight - 50;
    setIsScrolledUp(!isAtBottom);

    // Clear new messages indicator if at bottom
    if (isAtBottom && hasNewMessages) {
      setHasNewMessages(false);
    }
  }, [hasNewMessages]);

  // Handle contacts scroll
  const handleContactsScroll = useCallback(() => {
    if (!contactsScrollAreaRef.current) return;
    const container = contactsScrollAreaRef.current;
    const scrollPosition = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    setContactScrollPosition(scrollPosition / (scrollHeight - clientHeight));
    setShowContactJump(scrollHeight > clientHeight * 1.5);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (!messagesScrollAreaRef.current) return;

    messagesScrollAreaRef.current.scrollTo({
      top: messagesScrollAreaRef.current.scrollHeight,
      behavior: "smooth",
    });

    setHasNewMessages(false);
  }, []);

  // Scroll to specific contact group
  const scrollToContactGroup = useCallback((group: string) => {
    if (!contactsScrollAreaRef.current) return;
    const selector = document.getElementById(`contact-group-${group}`);
    if (selector) {
      contactsScrollAreaRef.current.scrollTo({
        top: selector.offsetTop - 10,
        behavior: "smooth",
      });
    }
  }, []);

  // Handle contact selection
  const handleContactSelect = useCallback(
    (contactId: string) => {
      setSelectedContactId(contactId);

      // Clear unread messages for this contact
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId ? { ...contact, unread: 0 } : contact
        )
      );

      // Reset scroll and new message indicators
      setIsScrolledUp(false);
      setHasNewMessages(false);

      // On mobile, open the chat view
      setIsMobileViewOpen(true);

      // Schedule scroll to bottom
      setTimeout(scrollToBottom, 100);
    },
    [setContacts]
  );

  // Add a new attachment
  const handleAddAttachment = useCallback(() => {
    // Simulate file selection dialog
    const fileTypes = ["image", "file", "audio"];
    const fileNames = [
      "document.pdf",
      "report.docx",
      "presentation.pptx",
      "spreadsheet.xlsx",
      "image.jpg",
    ];
    const fileSizes = ["1.2 MB", "3.5 MB", "2.1 MB", "500 KB", "4.7 MB"];
    const randomAttachment: Attachment = {
      id: `file-${Date.now()}`,
      type: fileTypes[Math.floor(Math.random() * fileTypes.length)] as
        | "image"
        | "file"
        | "audio",
      url: "#",
      name: fileNames[Math.floor(Math.random() * fileNames.length)],
      size: fileSizes[Math.floor(Math.random() * fileSizes.length)],
    };
    setPendingAttachments((prev) => [...prev, randomAttachment]);
    setHasAttachmentOpen(false);
  }, []);

  // Remove a pending attachment
  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  }, []);

  // Handle back button on mobile
  const handleBackToContacts = useCallback(() => {
    setIsMobileViewOpen(false);
  }, []);

  // Add emoji to message
  const handleAddEmoji = useCallback((emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
    messageInputRef.current?.focus();
  }, []);

  // Create a new conversation - this would need API implementation
  const handleNewConversation = useCallback(() => {
    // In a real app, this would open a dialog to select users and create a conversation
    console.log("Create new conversation");
  }, []);

  // Connect to WebSocket on component mount
  useEffect(() => {
    // Initialize WebSocket connection
    connect(currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`);

    // Listen for incoming messages
    const removeMessageListener = socketService.addMessageListener(
      (message) => {
        if (message.type === "message") {
          handleIncomingMessage(message);
        } else if (message.type === "callInvitation") {
          handleCallInvitation(message);
        }
      }
    );

    return () => {
      removeMessageListener();
    };
  }, [currentUser.id, currentUser.firstName, currentUser.lastName, connect]);

  // Handle incoming messages from WebSocket
  const handleIncomingMessage = useCallback(
    (message: any) => {
      const { senderId, conversationId, text, messageType } = message;
      // Find the contact/conversation this message belongs to
      const contactId = contacts.find(
        (c) => c.id.toString() === conversationId || c.userId === senderId
      )?.id;
      if (contactId) {
        // Update last message in contacts list
        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === contactId
              ? {
                  ...contact,
                  lastMessage: text,
                  lastMessageTime: "Just now",
                  unread:
                    selectedContactId !== contactId ? contact.unread + 1 : 0,
                }
              : contact
          )
        );
        // If this is the current conversation, add message to the messages list
        if (contactId === selectedContactId) {
          const newMessage = {
            id: Date.now(),
            senderId: contactId,
            text,
            timestamp: format(new Date(), "h:mm a"),
            createdAt: new Date(),
            status: "delivered",
          };

          messageManager.messages.push(newMessage);
          // If scrolled up, show new message indicator
          if (isScrolledUp) {
            setHasNewMessages(true);
          } else {
            // Schedule scroll to bottom
            setTimeout(scrollToBottom, 100);
          }
        }
      }
    },
    [
      contacts,
      selectedContactId,
      isScrolledUp,
      messageManager,
      scrollToBottom,
      setContacts,
    ]
  );

  // Handle call invitation
  const handleCallInvitation = useCallback((message: any) => {
    const { roomId, callSessionId, creatorId, creatorName } = message;
    // Show notification or auto-open call modal
    // For demo, we'll just log it
    console.log(`Incoming call from ${creatorName}`);
    // In a real app, you might show a notification with accept/decline options
    // If accepted:
    // setIsCallModalOpen(true);
  }, []);

  // Handle user status changes
  useEffect(() => {
    const handleUserStatusChange = (
      userId: string,
      status: "online" | "offline" | "away"
    ) => {
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.userId === userId ? { ...contact, status } : contact
        )
      );
    };

    // Set up listener for user status changes
    const removeStatusListener = socketService.addMessageListener((message) => {
      if (message.type === "userStatus" && message.userId) {
        handleUserStatusChange(message.userId, message.status);
      }
    });

    // Get initial status from the socket store
    Object.entries(userStatuses).forEach(([userId, status]) => {
      handleUserStatusChange(userId, status);
    });

    return () => {
      removeStatusListener();
    };
  }, [userStatuses, setContacts]);

  return (
    <MentorDashboardShell>
      <MentorDashboardHeader
        heading="Messages"
        text="Chat with your mentors and peers"
      >
        <NotificationsButton />
      </MentorDashboardHeader>

      <div className="mt-6 h-[calc(100vh-13rem)] overflow-hidden rounded-lg border bg-background shadow-sm">
        <div className="grid h-full grid-cols-1 md:grid-cols-3">
          {/* Contacts sidebar - hidden on mobile when chat is open */}
          <div
            className={cn(
              "border-r flex flex-col",
              isMobileViewOpen ? "hidden md:flex" : "flex"
            )}
          >
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  </div>
                )}
              </div>

              <Tabs
                defaultValue="all"
                value={activeTab}
                className="w-full"
                onValueChange={handleTabChange}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="online" className="flex-1">
                    Online
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1">
                    Unread
                    {filteredContacts.reduce((sum, c) => sum + c.unread, 0) >
                      0 && (
                      <Badge variant="default" className="ml-1.5">
                        {filteredContacts.reduce((sum, c) => sum + c.unread, 0)}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Loading state */}
            {contactsLoading && contacts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading contacts...
                </p>
              </div>
            )}

            {/* Error state */}
            {contactsError && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <p className="text-destructive">Failed to load contacts</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fetchContacts()}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!contactsLoading && !contactsError && contacts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <p className="text-muted-foreground mb-2">No contacts found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : "Start a new conversation or try a different search"}
                </p>
              </div>
            )}

            {/* Continue with your existing contact groups rendering */}
            {/* ...existing code for contact list... */}
          </div>

          {/* Chat area */}
          {/* ...existing code for chat area... */}

          {/* Empty state when no contact is selected */}
          {!selectedContact && !isMobileViewOpen && (
            <div className="col-span-2 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">Select a conversation</h3>
              <p className="mt-2 text-muted-foreground">
                Choose a contact from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Video call modal */}
      {selectedContact && (
        <VideoCallModal
          open={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          contactName={selectedContact.name}
          contactAvatar={selectedContact.avatar}
        />
      )}
    </MentorDashboardShell>
  );
}
