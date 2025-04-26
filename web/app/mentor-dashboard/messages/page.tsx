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
import chalk from "chalk";

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

// Create demo contacts function - improved to include a wider variety of contacts and search support

// Custom hooks for fetching real data
// Updated function to fetch real contacts from the API
function useContacts(currentUserId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(
    async (query = "", filter = "all") => {
      if (!currentUserId) return;

      setIsLoading(true);
      try {
        // Fetch users from the API
        const response = await fetch(
          `/api/users?search=${encodeURIComponent(query)}&limit=50`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch contacts");
        }

        const users = await response.json();

        // Also fetch conversations to get the last messages
        const convResponse = await fetch(`/api/conversations`);
        const conversations = convResponse.ok ? await convResponse.json() : [];

        // Transform users into contacts format
        const userContacts = users.map((user: any) => {
          // Find if this user has a conversation with current user
          const conversation = conversations.find((conv: any) =>
            conv.otherParticipants.some((p: any) => p.id === user.id)
          );

          return {
            id: conversation?.id || `user-${user.id}`, // Use conversation ID if exists, otherwise create a temporary ID
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            avatar: user.image || "/placeholder.svg?height=40&width=40",
            status: "offline", // Will be updated by WebSocket
            lastMessage:
              conversation?.lastMessage?.content || "Start a conversation",
            lastMessageTime: conversation?.lastMessage
              ? formatMessageTime(new Date(conversation.lastMessage.sentAt))
              : "",
            unread: conversation?.unreadCount || 0,
          };
        });

        setContacts(userContacts);
        setError(null);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        // We're already showing demo data, just set an error message
        setError("Using demo data - couldn't connect to server");
      } finally {
        setIsLoading(false);
      }
    },
    [currentUserId]
  );

  // Helper to format message times
  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  // Load contacts immediately on mount
  useEffect(() => {
    // try to fetch real contacts
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

// Add this function before the useMessages hook
function createDemoMessages(conversationId: string | null) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return [
    {
      id: 1,
      senderId: "demo-user-1",
      sender: {
        id: "demo-user-1",
        firstName: "Emma",
        lastName: "Wilson",
        image: "/placeholder.svg?height=40&width=40",
      },
      receiverId: "current-user",
      conversationId: conversationId || "demo-conv-1",
      content: "Hi there! How's your project coming along?",
      sentAt: new Date(now.getTime() - 60 * 60000).toISOString(),
      readAt: new Date(now.getTime() - 55 * 60000).toISOString(),
      attachments: [],
      messageType: "TEXT",
    },
    {
      id: 2,
      senderId: "current-user",
      sender: {
        id: "current-user",
        firstName: "You",
        lastName: "",
        image: "/placeholder.svg?height=40&width=40",
      },
      receiverId: "demo-user-1",
      conversationId: conversationId || "demo-conv-1",
      content: "It's going well! I'm making progress on the React components.",
      sentAt: new Date(now.getTime() - 40 * 60000).toISOString(),
      readAt: new Date(now.getTime() - 38 * 60000).toISOString(),
      attachments: [],
      messageType: "TEXT",
    },
    {
      id: 3,
      senderId: "demo-user-1",
      sender: {
        id: "demo-user-1",
        firstName: "Emma",
        lastName: "Wilson",
        image: "/placeholder.svg?height=40&width=40",
      },
      receiverId: "current-user",
      conversationId: conversationId || "demo-conv-1",
      content:
        "That's great! Do you have any questions about the state management?",
      sentAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      readAt: new Date(now.getTime() - 25 * 60000).toISOString(),
      attachments: [],
      messageType: "TEXT",
    },
    {
      id: 4,
      senderId: "current-user",
      sender: {
        id: "current-user",
        firstName: "You",
        lastName: "",
        image: "/placeholder.svg?height=40&width=40",
      },
      receiverId: "demo-user-1",
      conversationId: conversationId || "demo-conv-1",
      content:
        "Actually, yes. I'm trying to figure out the best approach for the shared state between components.",
      sentAt: new Date(now.getTime() - 20 * 60000).toISOString(),
      readAt: null,
      attachments: [],
      messageType: "TEXT",
    },
    {
      id: 5,
      senderId: "demo-user-1",
      sender: {
        id: "demo-user-1",
        firstName: "Emma",
        lastName: "Wilson",
        image: "/placeholder.svg?height=40&width=40",
      },
      receiverId: "current-user",
      conversationId: conversationId || "demo-conv-1",
      content:
        "Let me know if you want to discuss it in our next session. We can look at Context API or Redux depending on your needs.",
      sentAt: new Date(now.getTime() - 10 * 60000).toISOString(),
      readAt: null,
      attachments: [],
      messageType: "TEXT",
    },
  ];
}

// Updated function to handle real messages from the API with better error logging
function useMessages(conversationId: string | null, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      // Check if this is a temporary conversation ID (for new conversations)
      if (conversationId.startsWith("user-")) {
        // This is a new conversation, set empty messages
        setMessages([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/messages?conversationId=${conversationId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();

      // Transform API messages to match our Message interface
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId === currentUserId ? 0 : msg.senderId,
        text: msg.content,
        timestamp: format(new Date(msg.sentAt), "h:mm a"),
        createdAt: new Date(msg.sentAt),
        status: msg.readAt
          ? "read"
          : msg.senderId !== currentUserId
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
      // Use demo data as fallback
      const demoData = createDemoMessages(conversationId);
      const formattedDemoMessages = demoData.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId === currentUserId ? 0 : msg.senderId,
        text: msg.content,
        timestamp: format(new Date(msg.sentAt), "h:mm a"),
        createdAt: new Date(msg.sentAt),
        status: msg.readAt
          ? "read"
          : msg.senderId !== currentUserId
          ? "delivered"
          : "sent",
        attachments: [],
        replyTo: undefined,
        edited: false,
      }));

      // @ts-ignore
      setMessages(formattedDemoMessages);
      setError(
        `Using demo messages - Server error: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Function to send a message with improved error handling
  const sendMessage = useCallback(
    async (text: string, replyToId?: number, attachments?: Attachment[]) => {
      if (!conversationId || !text.trim()) {
        return null;
      }

      // Create a temporary message ID for optimistic UI
      const tempId = Date.now();

      try {
        // Check if this is a new conversation
        let actualConversationId = conversationId;

        if (conversationId.startsWith("user-")) {
          // This is a new conversation, create it first
          const userId = conversationId.replace("user-", "");
          console.log(
            chalk.blue(`Creating new conversation with user: ${userId}`)
          );

          const response = await fetch("/api/conversations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              participantIds: [userId],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              chalk.red("Failed to create conversation:"),
              chalk.yellow("Status:"),
              response.status,
              chalk.yellow("Response:"),
              errorData
            );
            throw new Error(
              errorData.error ||
                `Failed to create conversation (${response.status})`
            );
          }

          const newConversation = await response.json();
          console.log(
            chalk.green(`Conversation created with ID: ${newConversation.id}`)
          );
          actualConversationId = newConversation.id;
        }

        // Add a temporary message for immediate display
        const tempMessage: Message = {
          id: tempId,
          senderId: 0, // Current user
          text: text.trim(),
          timestamp: format(new Date(), "h:mm a"),
          createdAt: new Date(),
          status: "sent",
          attachments: attachments || [],
          replyTo: replyToId,
        };

        // Optimistically add to UI
        setMessages((prev) => [...prev, tempMessage]);

        // Send to API
        console.log(
          chalk.blue(`Sending message to conversation: ${actualConversationId}`)
        );
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: actualConversationId,
            content: text.trim(),
            attachments: attachments ? attachments.map((a) => a.url) : [],
            replyToId: replyToId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            chalk.red("Failed to send message:"),
            chalk.yellow("Status:"),
            response.status,
            chalk.yellow("Response:"),
            errorData
          );
          throw new Error(
            errorData.error || `Failed to send message (${response.status})`
          );
        }

        const savedMessage = await response.json();
        console.log(
          chalk.green(`Message sent successfully with ID: ${savedMessage.id}`)
        );

        // Refresh messages to get the real message with ID from server
        fetchMessages();

        return tempMessage;
      } catch (err) {
        console.error(chalk.red("Error sending message:"), err);
        // Remove the temp message on failure
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        const errorMessage = err instanceof Error ? err.message : String(err);
        alert(`Failed to send message: ${errorMessage}`);
        return null;
      }
    },
    [conversationId, fetchMessages, setMessages]
  );

  return {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
  };
}

// Rest of the file remains the same
// ...existing code...

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

  // Derived state
  // For now we'll use a hardcoded current user - in a real app this would come from authentication
  const [currentUser, setCurrentUser] = useState<any>({
    id: "demo-user-current", // Use a more recognizable demo ID
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

    // @ts-ignore
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
                  unread: 0,
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

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser({
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            status: "online",
          });
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        // Use demo user as fallback
      }
    };

    fetchCurrentUser();
  }, []);

  // Connect to WebSocket on component mount
  useEffect(() => {
    if (!currentUser?.id) return;

    // Initialize WebSocket connection
    connect(currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`);

    // Listen for incoming messages
    const removeMessageListener = socketService.addMessageListener(
      (message) => {
        if (message.type === "message") {
          handleIncomingMessage(message);
        } else if (message.type === "typing") {
          handleTypingIndicator(message);
        } else if (message.type === "callInvitation") {
          handleCallInvitation(message);
        }
      }
    );

    return () => {
      removeMessageListener();
    };
  }, [currentUser?.id, currentUser?.firstName, currentUser?.lastName, connect]);

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

          // @ts-ignore
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

  // Handle typing indicators
  const handleTypingIndicator = useCallback(
    (message: any) => {
      const { userId, conversationId, isTyping } = message;

      // If this is for the currently selected conversation
      if (conversationId === selectedContactId) {
        // Set typing state
        setIsTyping(isTyping);
      }
    },
    [selectedContactId]
  );

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

            {/* Contact list */}
            {contacts.length > 0 && (
              <div className="relative flex-1">
                <ScrollArea
                  className="h-[calc(100vh-24rem)]"
                  onScrollCapture={handleContactsScroll}
                  ref={contactsScrollAreaRef}
                >
                  <div className="space-y-4 py-2">
                    {/* Online contacts */}
                    {groupedContacts.online.length > 0 && (
                      <div id="contact-group-online">
                        <h3 className="text-xs font-medium text-muted-foreground px-4 mb-1">
                          Online
                        </h3>
                        <div className="space-y-1 px-2">
                          {groupedContacts.online.map((contact) => (
                            <button
                              key={contact.id}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
                                selectedContactId === contact.id
                                  ? "bg-muted/80"
                                  : ""
                              )}
                              onClick={() => handleContactSelect(contact.id)}
                            >
                              <div className="relative">
                                <Avatar>
                                  <AvatarImage
                                    src={contact.avatar}
                                    alt={contact.name}
                                  />
                                  <AvatarFallback>
                                    {contact.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span
                                  className={cn(
                                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                    contact.status === "online" &&
                                      "bg-green-500",
                                    contact.status === "away" &&
                                      "bg-yellow-500",
                                    contact.status === "offline" &&
                                      "bg-gray-400"
                                  )}
                                />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">
                                    {contact.name}
                                  </h3>
                                  <span className="text-xs text-muted-foreground">
                                    {contact.lastMessageTime}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {contact.role}
                                </p>
                                <p className="mt-1 truncate text-sm">
                                  {contact.lastMessage}
                                </p>
                              </div>
                              {contact.unread > 0 && (
                                <Badge variant="default" className="ml-auto">
                                  {contact.unread}
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unread messages */}
                    {groupedContacts.unread.length > 0 && (
                      <div id="contact-group-unread">
                        <h3 className="text-xs font-medium text-muted-foreground px-4 mb-1">
                          Unread
                        </h3>
                        <div className="space-y-1 px-2">
                          {groupedContacts.unread.map((contact) => (
                            <button
                              key={contact.id}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
                                selectedContactId === contact.id
                                  ? "bg-muted/80"
                                  : ""
                              )}
                              onClick={() => handleContactSelect(contact.id)}
                            >
                              <div className="relative">
                                <Avatar>
                                  <AvatarImage
                                    src={contact.avatar}
                                    alt={contact.name}
                                  />
                                  <AvatarFallback>
                                    {contact.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span
                                  className={cn(
                                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                    contact.status === "online" &&
                                      "bg-green-500",
                                    contact.status === "away" &&
                                      "bg-yellow-500",
                                    contact.status === "offline" &&
                                      "bg-gray-400"
                                  )}
                                />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">
                                    {contact.name}
                                  </h3>
                                  <span className="text-xs text-muted-foreground">
                                    {contact.lastMessageTime}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {contact.role}
                                </p>
                                <p className="mt-1 truncate text-sm">
                                  {contact.lastMessage}
                                </p>
                              </div>
                              {contact.unread > 0 && (
                                <Badge variant="default" className="ml-auto">
                                  {contact.unread}
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other contacts */}
                    {groupedContacts.other.length > 0 && (
                      <div id="contact-group-other">
                        <h3 className="text-xs font-medium text-muted-foreground px-4 mb-1">
                          Others
                        </h3>
                        <div className="space-y-1 px-2">
                          {groupedContacts.other.map((contact) => (
                            <button
                              key={contact.id}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
                                selectedContactId === contact.id
                                  ? "bg-muted/80"
                                  : ""
                              )}
                              onClick={() => handleContactSelect(contact.id)}
                            >
                              <div className="relative">
                                <Avatar>
                                  <AvatarImage
                                    src={contact.avatar}
                                    alt={contact.name}
                                  />
                                  <AvatarFallback>
                                    {contact.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span
                                  className={cn(
                                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                    contact.status === "online" &&
                                      "bg-green-500",
                                    contact.status === "away" &&
                                      "bg-yellow-500",
                                    contact.status === "offline" &&
                                      "bg-gray-400"
                                  )}
                                />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">
                                    {contact.name}
                                  </h3>
                                  <span className="text-xs text-muted-foreground">
                                    {contact.lastMessageTime}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {contact.role}
                                </p>
                                <p className="mt-1 truncate text-sm">
                                  {contact.lastMessage}
                                </p>
                              </div>
                              {contact.unread > 0 && (
                                <Badge variant="default" className="ml-auto">
                                  {contact.unread}
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="absolute bottom-4 right-4">
                  <Button
                    onClick={handleNewConversation}
                    className="rounded-full"
                    size="icon"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Chat area - Add implementation for selected contact */}
          {selectedContact && (
            <div
              className={cn(
                "col-span-2 flex flex-col",
                isMobileViewOpen ? "flex" : "hidden md:flex"
              )}
            >
              {/* Chat header */}
              <div className="border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={handleBackToContacts}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <div className="relative">
                    <Avatar>
                      <AvatarImage
                        src={selectedContact.avatar}
                        alt={selectedContact.name}
                      />
                      <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                        selectedContact.status === "online" && "bg-green-500",
                        selectedContact.status === "away" && "bg-yellow-500",
                        selectedContact.status === "offline" && "bg-gray-400"
                      )}
                    />
                  </div>

                  <div>
                    <h3 className="font-medium">{selectedContact.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground">
                        {selectedContact.role}
                      </p>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {selectedContact.status === "online"
                          ? "Online"
                          : selectedContact.status === "away"
                          ? "Away"
                          : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                    <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.location.href = 'http://localhost:5173/Private%20Call'}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                      <p>Video call</p>
                      </TooltipContent>
                    </Tooltip>
                    </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View profile</DropdownMenuItem>
                      <DropdownMenuItem>Mute notifications</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Clear chat history</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-hidden">
                {messageManager.isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading messages...
                    </p>
                  </div>
                ) : messageManager.error ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <p className="text-destructive mb-2">
                      Failed to load messages
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Using demo messages instead
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => messageManager.fetchMessages?.()}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <ScrollArea
                    className="h-[calc(100vh-26rem)]"
                    ref={messagesScrollAreaRef}
                    onScrollCapture={handleMessagesScroll}
                  >
                    <div className="flex flex-col gap-3 p-4">
                      {Object.entries(messageManager.groupedMessages).map(
                        ([date, messages]) => (
                          <div key={date}>
                            <div className="relative mb-3 mt-3">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center">
                                <span className="bg-background px-2 text-xs text-muted-foreground">
                                  {date}
                                </span>
                              </div>
                            </div>

                            {messages.map((message) => (
                              <div key={message.id} className="group">
                                {message.replyTo && (
                                  <div
                                    className={cn(
                                      "mb-1 rounded p-2 text-sm border-l-4 mx-6 bg-muted/50",
                                      message.senderId === 0 ? "ml-12" : "mr-12"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Reply className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Replying to{" "}
                                        {message.senderId === 0
                                          ? selectedContact.name
                                          : "yourself"}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs truncate">
                                      {messageManager.getMessageById(
                                        message.replyTo
                                      )?.text ||
                                        "Original message not available"}
                                    </p>
                                  </div>
                                )}

                                <div
                                  className={cn(
                                    "flex items-start gap-3 px-4 py-2",
                                    message.senderId === 0
                                      ? "justify-end"
                                      : "justify-start"
                                  )}
                                >
                                  {message.senderId !== 0 && (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={selectedContact.avatar}
                                        alt={selectedContact.name}
                                      />
                                      <AvatarFallback>
                                        {selectedContact.name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}

                                  <div
                                    className={cn(
                                      "relative rounded-lg px-3 py-2 max-w-[85%]",
                                      message.senderId === 0
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                    )}
                                  >
                                    {messageManager.editingMessageId ===
                                    message.id ? (
                                      <div className="min-w-[200px]">
                                        <Textarea
                                          value={messageManager.editText}
                                          onChange={(e) =>
                                            messageManager.setEditText(
                                              e.target.value
                                            )
                                          }
                                          className="mb-2 min-h-[80px] bg-background/50"
                                          placeholder="Edit your message..."
                                        />
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={
                                              messageManager.cancelEditingMessage
                                            }
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={
                                              messageManager.saveEditedMessage
                                            }
                                            disabled={
                                              !messageManager.editText.trim()
                                            }
                                          >
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="whitespace-pre-wrap break-words text-sm">
                                          {message.text}
                                        </p>

                                        {message.attachments?.map(
                                          (attachment) => (
                                            <div
                                              key={attachment.id}
                                              className="mt-2"
                                            >
                                              {attachment.type === "image" ? (
                                                <div className="rounded-md overflow-hidden">
                                                  <img
                                                    src={attachment.url}
                                                    alt="Attachment"
                                                    className="max-w-full h-auto"
                                                  />
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                                                  <File className="h-5 w-5 text-muted-foreground" />
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                      {attachment.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                      {attachment.size}
                                                    </p>
                                                  </div>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                  >
                                                    Download
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        )}

                                        <div
                                          className={cn(
                                            "flex items-center gap-1 mt-1",
                                            message.senderId === 0
                                              ? "justify-end text-primary-foreground/70"
                                              : "justify-start text-muted-foreground"
                                          )}
                                        >
                                          <p className="text-[10px]">
                                            {message.timestamp}
                                          </p>

                                          {message.edited && (
                                            <>
                                              <span className="text-[10px]">
                                                •
                                              </span>
                                              <p className="text-[10px]">
                                                edited
                                              </p>
                                            </>
                                          )}

                                          {message.senderId === 0 && (
                                            <>
                                              <span className="text-[10px]">
                                                •
                                              </span>
                                              <p className="text-[10px]">
                                                {message.status === "sent" &&
                                                  "Sent"}
                                                {message.status ===
                                                  "delivered" && "Delivered"}
                                                {message.status === "read" &&
                                                  "Read"}
                                              </p>
                                            </>
                                          )}
                                        </div>
                                      </>
                                    )}

                                    {/* Message actions */}
                                    {message.senderId === 0 &&
                                      !messageManager.editingMessageId && (
                                        <div className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 text-primary-foreground hover:bg-primary/20"
                                              >
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                              side="top"
                                              align="end"
                                            >
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  messageManager.startEditingMessage(
                                                    message.id
                                                  )
                                                }
                                              >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  messageManager.startReplyingToMessage(
                                                    message.id
                                                  )
                                                }
                                              >
                                                <Reply className="mr-2 h-4 w-4" />
                                                Reply
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  messageManager.deleteMessage(
                                                    message.id
                                                  )
                                                }
                                                className="text-destructive focus:text-destructive"
                                              >
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      )}

                                    {message.senderId !== 0 &&
                                      !messageManager.editingMessageId && (
                                        <div className="absolute left-0 top-0 opacity-0 transition-opacity group-hover:opacity-100">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/70 hover:bg-muted/90"
                                              >
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                              side="top"
                                              align="start"
                                            >
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  messageManager.startReplyingToMessage(
                                                    message.id
                                                  )
                                                }
                                              >
                                                <Reply className="mr-2 h-4 w-4" />
                                                Reply
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      )}
                                  </div>

                                  {message.senderId === 0 && (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src="/placeholder.svg?height=32&width=32"
                                        alt="Your avatar"
                                      />
                                      <AvatarFallback>You</AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}

                      {/* Typing indicator */}
                      {messageManager.isTyping && (
                        <div className="flex items-start gap-3 px-4 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={selectedContact.avatar}
                              alt={selectedContact.name}
                            />
                            <AvatarFallback>
                              {selectedContact.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex h-9 w-16 items-center justify-center gap-1 rounded-full bg-muted">
                            <span
                              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                              style={{ animationDelay: "200ms" }}
                            />
                            <span
                              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                              style={{ animationDelay: "400ms" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}

                {/* New messages indicator */}
                {hasNewMessages && (
                  <Button
                    className="absolute bottom-[72px] right-6 z-10 h-8 rounded-full shadow-md"
                    size="sm"
                    onClick={scrollToBottom}
                  >
                    New messages
                    <ArrowDown className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Message input */}
              <div className="border-t p-4">
                {/* Reply indicator */}
                {messageManager.replyingToId && (
                  <div className="mb-2 flex items-center justify-between rounded-md bg-muted p-2">
                    <div className="flex items-center gap-2">
                      <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="text-xs font-medium">
                          Replying to{" "}
                          {messageManager.getMessageById(
                            messageManager.replyingToId
                          )?.senderId === 0
                            ? "yourself"
                            : selectedContact.name}
                        </span>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                          {messageManager.getMessageById(
                            messageManager.replyingToId
                          )?.text || ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={messageManager.cancelReplyingToMessage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Attachment preview */}
                {pendingAttachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {pendingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 rounded-md border bg-background p-2"
                      >
                        <File className="h-4 w-4 text-muted-foreground" />
                        <div className="text-xs">
                          <p className="font-medium">{attachment.name}</p>
                          <p className="text-muted-foreground">
                            {attachment.size}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-2">
                  <div className="flex">
                    <DropdownMenu
                      open={hasAttachmentOpen}
                      onOpenChange={setHasAttachmentOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-r-none border-r-0"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={handleAddAttachment}>
                          <File className="mr-2 h-4 w-4" />
                          Document
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleAddAttachment}>
                          <img
                            src="/placeholder.svg?height=16&width=16"
                            alt=""
                            className="mr-2 h-4 w-4"
                          />
                          Image
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu
                      open={isEmojiPickerOpen}
                      onOpenChange={setIsEmojiPickerOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-l-none"
                        >
                          <SmilePlus className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="flex flex-wrap p-2 w-64"
                      >
                        {[
                          "😊",
                          "👍",
                          "❤️",
                          "😂",
                          "😎",
                          "🎉",
                          "🤔",
                          "😢",
                          "🙏",
                          "🔥",
                          "✨",
                          "🥳",
                        ].map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            onClick={() => handleAddEmoji(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Textarea
                    placeholder="Type your message..."
                    className="flex-1 min-h-[40px] resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    ref={messageInputRef}
                  />

                  <Button
                    type="submit"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={
                      !newMessage.trim() && pendingAttachments.length === 0
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

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
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleNewConversation}
              >
                Start a new conversation
              </Button>
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
