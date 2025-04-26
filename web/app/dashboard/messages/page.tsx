"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { 
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpDown, Clock, Edit, File, 
  MoreHorizontal, Paperclip, Reply, Search, Send, SmilePlus, Trash, Video, X 
} from "lucide-react"
import { format, isToday, isYesterday, parseISO } from "date-fns"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatbotCard } from "@/components/dashboard/chatbot-card"
import { NotificationsButton } from "@/components/dashboard/notifications-button"
import { VideoCallModal } from "@/components/messages/video-call-modal"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Types
interface Contact {
  id: number
  name: string
  role: string
  avatar: string
  status: "online" | "offline" | "away"
  lastMessage: string
  lastMessageTime: string
  unread: number
}

interface Attachment {
  id: string
  type: "image" | "file" | "audio"
  url: string
  name?: string
  size?: string
  thumbnailUrl?: string
}

interface Message {
  id: number
  senderId: number
  text: string
  timestamp: string
  createdAt: Date
  status: "sent" | "delivered" | "read"
  attachments?: Attachment[]
  replyTo?: number
  edited?: boolean
}

// Sample data
const initialContacts: Contact[] = [
  {
    id: 1,
    name: "Emma Wilson",
    role: "Frontend Mentor",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    lastMessage: "Let me know if you have any questions about the React components.",
    lastMessageTime: "10:30 AM",
    unread: 2,
  },
  {
    id: 2,
    name: "Dr. Alex Rivera",
    role: "AI/ML Mentor",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "offline",
    lastMessage: "We'll continue with neural networks in our next session.",
    lastMessageTime: "Yesterday",
    unread: 0,
  },
  {
    id: 3,
    name: "Jamal Washington",
    role: "Cybersecurity Mentor",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    lastMessage: "Here's the link to the security resources we discussed.",
    lastMessageTime: "Yesterday",
    unread: 0,
  },
  {
    id: 4,
    name: "Sophia Chen",
    role: "Mobile Dev Mentor",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    lastMessage: "Your React Native project is coming along nicely!",
    lastMessageTime: "Monday",
    unread: 0,
  },
  {
    id: 5,
    name: "Marco Rodriguez",
    role: "Backend Mentor",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    lastMessage: "I'll help you set up that database architecture.",
    lastMessageTime: "Tuesday",
    unread: 1,
  },
  {
    id: 6,
    name: "Leila Johnson",
    role: "UX/UI Mentor",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    lastMessage: "Your design portfolio is looking great!",
    lastMessageTime: "Last week",
    unread: 0,
  },
]

// Initial messages for demo
const createInitialMessages = (contactId: number): Message[] => {
  const now = new Date()
  
  if (contactId === 1) {
    return [
      {
        id: 1,
        senderId: 1,
        text: "Hi there! How's your progress with the React components?",
        timestamp: format(new Date(now.getTime() - 30 * 60000), 'h:mm a'),
        createdAt: new Date(now.getTime() - 30 * 60000),
        status: "read",
      },
      {
        id: 2,
        senderId: 0,
        text: "I'm doing well! I've completed the Button and Card components, but I'm having some issues with the Modal component.",
        timestamp: format(new Date(now.getTime() - 25 * 60000), 'h:mm a'),
        createdAt: new Date(now.getTime() - 25 * 60000),
        status: "read",
      },
      {
        id: 3,
        senderId: 1,
        text: "That's great progress! The Modal can be tricky. What specific issues are you facing?",
        timestamp: format(new Date(now.getTime() - 20 * 60000), 'h:mm a'),
        createdAt: new Date(now.getTime() - 20 * 60000),
        status: "read",
      },
      {
        id: 4,
        senderId: 0,
        text: "I'm having trouble with the focus management when the modal opens. The focus doesn't trap inside the modal.",
        timestamp: format(new Date(now.getTime() - 15 * 60000), 'h:mm a'),
        createdAt: new Date(now.getTime() - 15 * 60000),
        status: "read",
      },
      {
        id: 5,
        senderId: 1,
        text: "Ah, I see. For focus management, you should use the FocusTrap component or a library like focus-trap-react. It handles all the keyboard navigation and accessibility concerns.",
        timestamp: format(new Date(now.getTime() - 10 * 60000), 'h:mm a'),
        createdAt: new Date(now.getTime() - 10 * 60000),
        status: "read",
        attachments: [
          {
            id: "file1",
            type: "file",
            url: "#", 
            name: "focus-trap-examples.zip",
            size: "1.2 MB"
          }
        ]
      },
      {
        id: 6,
        senderId: 1,
        text: "Let me know if you have any questions about the React components. We can also discuss this in our next session if you'd like.",
        timestamp: format(new Date(now.getTime() - 5 * 60000), 'h:mm a'),
        createdAt: new Date(now.getTime() - 5 * 60000),
        status: "delivered",
      },
    ]
  }
  
  // For other contacts, return a simple conversation
  return [
    {
      id: 1,
      senderId: contactId,
      text: `Hi there! I'm ${initialContacts.find(c => c.id === contactId)?.name}. How can I help you today?`,
      timestamp: format(new Date(now.getTime() - 10 * 60000), 'h:mm a'),
      createdAt: new Date(now.getTime() - 10 * 60000),
      status: "read",
    },
    {
      id: 2,
      senderId: 0,
      text: "Thanks for connecting! I'm looking forward to our mentoring sessions.",
      timestamp: format(new Date(now.getTime() - 5 * 60000), 'h:mm a'),
      createdAt: new Date(now.getTime() - 5 * 60000),
      status: "read",
    },
  ]
}

// Custom hooks
function useMessagesManager(contactId: number) {
  const [messages, setMessages] = useState<Message[]>(() => createInitialMessages(contactId))
  const [isTyping, setIsTyping] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Record<string, Message[]> = {}
    
    messages.forEach(message => {
      const date = getMessageDateLabel(message.createdAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }, [messages])

  // Find a message by ID
  const getMessageById = useCallback((id: number) => {
    return messages.find(m => m.id === id)
  }, [messages])

  // Send a new message
  const sendMessage = useCallback((text: string, replyToId?: number, attachments?: Attachment[]) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return
    
    const now = new Date()
    const newMessage: Message = {
      id: Date.now(),
      senderId: 0,
      text: text.trim(),
      timestamp: format(now, 'h:mm a'),
      createdAt: now,
      status: "sent",
      attachments,
      replyTo: replyToId || undefined
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // Simulate typing indicator
    setIsTyping(true)
    
    // Simulate reply after random delay
    const replyDelay = 1000 + Math.random() * 3000
    setTimeout(() => {
      setIsTyping(false)
      
      const replyMessages = [
        "Thanks for your message! I'll look into this.",
        "Got it, let me get back to you on this soon.",
        "I understand your point. Let's discuss this further.",
        "That's an interesting question. Let me think about it.",
        "I appreciate you sharing that with me.",
      ]
      
      const replyText = replyMessages[Math.floor(Math.random() * replyMessages.length)]
      const replyNow = new Date()
      
      const reply: Message = {
        id: Date.now(),
        senderId: contactId,
        text: replyText,
        timestamp: format(replyNow, 'h:mm a'),
        createdAt: replyNow,
        status: "delivered",
        replyTo: newMessage.id
      }
      
      setMessages(prev => [...prev, reply])
      
      // Simulate marking messages as delivered, then read
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.senderId === 0 && msg.status === "sent" 
              ? { ...msg, status: "delivered" } 
              : msg
          )
        )
        
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.senderId === 0 && msg.status === "delivered" 
                ? { ...msg, status: "read" } 
                : msg
            )
          )
        }, 2000)
      }, 1000)
    }, replyDelay)
    
    return newMessage
  }, [contactId])

  // Edit a message
  const startEditingMessage = useCallback((messageId: number) => {
    const message = messages.find(m => m.id === messageId)
    if (message && message.senderId === 0) {
      setEditingMessageId(messageId)
      setEditText(message.text)
    }
  }, [messages])
  
  const cancelEditingMessage = useCallback(() => {
    setEditingMessageId(null)
    setEditText("")
  }, [])
  
  const saveEditedMessage = useCallback(() => {
    if (editingMessageId && editText.trim()) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === editingMessageId 
            ? { ...msg, text: editText.trim(), edited: true } 
            : msg
        )
      )
      setEditingMessageId(null)
      setEditText("")
    }
  }, [editingMessageId, editText])

  // Delete a message
  const deleteMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  // Start replying to a message
  const startReplyingToMessage = useCallback((messageId: number) => {
    setReplyingToId(messageId)
  }, [])
  
  const cancelReplyingToMessage = useCallback(() => {
    setReplyingToId(null)
  }, [])

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
    cancelReplyingToMessage
  }
}

// Utility function to get date label
function getMessageDateLabel(date: Date): string {
  if (isToday(date)) {
    return "Today"
  } else if (isYesterday(date)) {
    return "Yesterday"
  } else {
    return format(date, 'EEEE, MMMM d')
  }
}

// Main component
export default function MessagesPage() {
  // State
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [selectedContactId, setSelectedContactId] = useState<number>(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [hasAttachmentOpen, setHasAttachmentOpen] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [showContactJump, setShowContactJump] = useState(false)
  const [contactScrollPosition, setContactScrollPosition] = useState(0)
  const [isMobileViewOpen, setIsMobileViewOpen] = useState(false)
  
  // Refs
  const messagesScrollAreaRef = useRef<HTMLDivElement>(null)
  const contactsScrollAreaRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  
  // Derived state
  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedContactId) || contacts[0], 
    [contacts, selectedContactId]
  )
  
  // Use custom hook for messages
  const messageManager = useMessagesManager(selectedContactId)
  
  // Filter contacts based on search and active tab
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === "all") return matchesSearch;
      if (activeTab === "online") return matchesSearch && contact.status === "online";
      if (activeTab === "unread") return matchesSearch && contact.unread > 0;
      return matchesSearch;
    });
  }, [contacts, searchQuery, activeTab]);
  
  // Group contacts by status
  const groupedContacts = useMemo(() => ({
    online: filteredContacts.filter(c => c.status === "online"),
    unread: filteredContacts.filter(c => c.unread > 0 && c.status !== "online"),
    other: filteredContacts.filter(c => c.status !== "online" && c.unread === 0)
  }), [filteredContacts]);
  
  // Handle sending a message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() && (!pendingAttachments || pendingAttachments.length === 0)) return
    
    const sentMessage = messageManager.sendMessage(
      newMessage, 
      messageManager.replyingToId || undefined,
      pendingAttachments.length > 0 ? pendingAttachments : undefined
    )
    
    if (sentMessage) {
      // Clear input and state
      setNewMessage("")
      setPendingAttachments([])
      messageManager.cancelReplyingToMessage()
      
      // Update last message for the contact
      setContacts(prev => 
        prev.map(contact => 
          contact.id === selectedContactId 
            ? { 
                ...contact, 
                lastMessage: newMessage.trim() || "Attachment sent",
                lastMessageTime: "Just now"
              } 
            : contact
        )
      )
      
      // If scrolled up, show new message indicator
      if (isScrolledUp) {
        setHasNewMessages(true)
      } else {
        // Schedule scroll to bottom
        setTimeout(scrollToBottom, 100)
      }
    }
  }, [
    newMessage, 
    pendingAttachments, 
    messageManager, 
    selectedContactId,
    isScrolledUp
  ])
  
  // Handle messages scroll
  const handleMessagesScroll = useCallback(() => {
    if (!messagesScrollAreaRef.current) return
    
    const container = messagesScrollAreaRef.current
    const scrollPosition = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    
    // Check if user has scrolled up
    const isAtBottom = scrollPosition + clientHeight >= scrollHeight - 50
    setIsScrolledUp(!isAtBottom)
    
    // Clear new messages indicator if at bottom
    if (isAtBottom && hasNewMessages) {
      setHasNewMessages(false)
    }
  }, [hasNewMessages])
  
  // Handle contacts scroll
  const handleContactsScroll = useCallback(() => {
    if (!contactsScrollAreaRef.current) return
    
    const container = contactsScrollAreaRef.current
    const scrollPosition = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    
    setContactScrollPosition(scrollPosition / (scrollHeight - clientHeight))
    setShowContactJump(scrollHeight > clientHeight * 1.5)
  }, [])
  
  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (!messagesScrollAreaRef.current) return
    
    messagesScrollAreaRef.current.scrollTo({
      top: messagesScrollAreaRef.current.scrollHeight,
      behavior: "smooth"
    })
    
    setHasNewMessages(false)
  }, [])
  
  // Scroll to specific contact group
  const scrollToContactGroup = useCallback((group: string) => {
    if (!contactsScrollAreaRef.current) return
    
    const selector = document.getElementById(`contact-group-${group}`)
    if (selector) {
      contactsScrollAreaRef.current.scrollTo({
        top: selector.offsetTop - 10,
        behavior: "smooth"
      })
    }
  }, [])
  
  // Handle contact selection
  const handleContactSelect = useCallback((contactId: number) => {
    setSelectedContactId(contactId)
    
    // Clear unread messages for this contact
    setContacts(prev => 
      prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, unread: 0 } 
          : contact
      )
    )
    
    // Reset scroll and new message indicators
    setIsScrolledUp(false)
    setHasNewMessages(false)
    
    // On mobile, open the chat view
    setIsMobileViewOpen(true)
    
    // Schedule scroll to bottom
    setTimeout(scrollToBottom, 100)
  }, [])
  
  // Add a new attachment
  const handleAddAttachment = useCallback(() => {
    // Simulate file selection dialog
    const fileTypes = ["image", "file", "audio"]
    const fileNames = ["document.pdf", "report.docx", "presentation.pptx", "spreadsheet.xlsx", "image.jpg"]
    const fileSizes = ["1.2 MB", "3.5 MB", "2.1 MB", "500 KB", "4.7 MB"]
    
    const randomAttachment: Attachment = {
      id: `file-${Date.now()}`,
      type: fileTypes[Math.floor(Math.random() * fileTypes.length)] as "image" | "file" | "audio",
      url: "#",
      name: fileNames[Math.floor(Math.random() * fileNames.length)],
      size: fileSizes[Math.floor(Math.random() * fileSizes.length)]
    }
    
    setPendingAttachments(prev => [...prev, randomAttachment])
    setHasAttachmentOpen(false)
  }, [])
  
  // Remove a pending attachment
  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== attachmentId))
  }, [])
  
  // Handle back button on mobile
  const handleBackToContacts = useCallback(() => {
    setIsMobileViewOpen(false)
  }, [])

  // Add emoji to message
  const handleAddEmoji = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setIsEmojiPickerOpen(false)
    messageInputRef.current?.focus()
  }, [])
  
  // Create a new conversation
  const handleNewConversation = useCallback(() => {
    // In a real app, this would open a dialog to select users
    // For this demo, we'll just add a new contact
    const newContactId = Math.max(...contacts.map(c => c.id)) + 1
    const newContact: Contact = {
      id: newContactId,
      name: `New Contact ${newContactId}`,
      role: "Student",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
      lastMessage: "Start a conversation...",
      lastMessageTime: "Just now",
      unread: 0,
    }
    
    setContacts(prev => [...prev, newContact])
    setSelectedContactId(newContactId)
    
    // Focus the message input
    setTimeout(() => {
      messageInputRef.current?.focus()
    }, 100)
  }, [contacts])

  // Scroll to bottom on initial render and when switching conversations
  useEffect(() => {
    setTimeout(scrollToBottom, 100)
    
    // Simulate real-time status changes for contacts
    const statusInterval = setInterval(() => {
      setContacts(prev => {
        const contactToUpdate = prev[Math.floor(Math.random() * prev.length)]
        const newStatus = ["online", "away", "offline"][Math.floor(Math.random() * 3)] as "online" | "offline" | "away"
        
        return prev.map(contact => 
          contact.id === contactToUpdate.id 
            ? { ...contact, status: newStatus } 
            : contact
        )
      })
    }, 20000) // Every 20 seconds
    
    return () => clearInterval(statusInterval)
  }, [])
  
  // Render attachment preview
  const renderAttachmentPreview = useCallback((attachment: Attachment) => {
    if (attachment.type === "file") {
      return (
        <div className="flex items-center gap-2 mt-2 p-3 rounded-md bg-muted/50">
          <File className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">{attachment.size}</p>
          </div>
          <Button variant="outline" size="sm">Download</Button>
        </div>
      )
    }
    
    if (attachment.type === "image") {
      return (
        <div className="mt-2 max-w-[240px] relative rounded-md overflow-hidden">
          <img 
            src={attachment.thumbnailUrl || "/placeholder.svg?height=120&width=240"} 
            alt="Image attachment" 
            className="w-full h-auto object-cover"
          />
        </div>
      )
    }
    
    return null
  }, [])

  return (
    <DashboardShell>
      <DashboardHeader heading="Messages" text="Chat with your mentors and peers">
        <NotificationsButton />
      </DashboardHeader>

      <div className="mt-6 h-[calc(100vh-13rem)] overflow-hidden rounded-lg border bg-background shadow-sm">
        <div className="grid h-full grid-cols-1 md:grid-cols-3">
          {/* Contacts sidebar - hidden on mobile when chat is open */}
          <div className={cn(
            "border-r flex flex-col",
            isMobileViewOpen ? "hidden md:flex" : "flex"
          )}>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="online" className="flex-1">Online</TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1">
                    Unread
                    {contacts.reduce((sum, c) => sum + c.unread, 0) > 0 && (
                      <Badge variant="default" className="ml-1.5">
                        {contacts.reduce((sum, c) => sum + c.unread, 0)}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Contact quick jump */}
            {showContactJump && (
              <div className="px-4 py-1 flex justify-between items-center border-b">
                <span className="text-xs font-medium text-muted-foreground">Jump to</span>
                <div className="flex gap-2">
                  {groupedContacts.online.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs flex items-center gap-1"
                            onClick={() => scrollToContactGroup('online')}
                          >
                            <span className="h-2 w-2 bg-green-500 rounded-full" />
                            <span>Online</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Jump to online contacts</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {groupedContacts.unread.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs flex items-center gap-1"
                            onClick={() => scrollToContactGroup('unread')}
                          >
                            <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
                              {groupedContacts.unread.reduce((sum, c) => sum + c.unread, 0)}
                            </Badge>
                            <span>Unread</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Jump to unread messages</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )}

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
                      <h3 className="text-xs font-medium text-muted-foreground px-4 mb-1">Online</h3>
                      <div className="space-y-1 px-2">
                        {groupedContacts.online.map((contact) => (
                          <button
                            key={contact.id}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
                              selectedContactId === contact.id ? "bg-muted/80" : ""
                            )}
                            onClick={() => handleContactSelect(contact.id)}
                          >
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={contact.avatar} alt={contact.name} />
                                <AvatarFallback>{contact.name[0]}</AvatarFallback>
                              </Avatar>
                              <span
                                className={cn(
                                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                  contact.status === "online" && "bg-green-500",
                                  contact.status === "away" && "bg-yellow-500",
                                  contact.status === "offline" && "bg-gray-400",
                                )}
                              />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{contact.name}</h3>
                                <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{contact.role}</p>
                              <p className="mt-1 truncate text-sm">{contact.lastMessage}</p>
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
                      <h3 className="text-xs font-medium text-muted-foreground px-4 mb-1">Unread</h3>
                      <div className="space-y-1 px-2">
                        {groupedContacts.unread.map((contact) => (
                          <button
                            key={contact.id}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
                              selectedContactId === contact.id ? "bg-muted/80" : ""
                            )}
                            onClick={() => handleContactSelect(contact.id)}
                          >
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={contact.avatar} alt={contact.name} />
                                <AvatarFallback>{contact.name[0]}</AvatarFallback>
                              </Avatar>
                              <span
                                className={cn(
                                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                  contact.status === "online" && "bg-green-500",
                                  contact.status === "away" && "bg-yellow-500",
                                  contact.status === "offline" && "bg-gray-400",
                                )}
                              />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{contact.name}</h3>
                                <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{contact.role}</p>
                              <p className="mt-1 truncate text-sm">{contact.lastMessage}</p>
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
                      <h3 className="text-xs font-medium text-muted-foreground px-4 mb-1">Others</h3>
                      <div className="space-y-1 px-2">
                        {groupedContacts.other.map((contact) => (
                          <button
                            key={contact.id}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
                              selectedContactId === contact.id ? "bg-muted/80" : ""
                            )}
                            onClick={() => handleContactSelect(contact.id)}
                          >
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={contact.avatar} alt={contact.name} />
                                <AvatarFallback>{contact.name[0]}</AvatarFallback>
                              </Avatar>
                              <span
                                className={cn(
                                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                  contact.status === "online" && "bg-green-500",
                                  contact.status === "away" && "bg-yellow-500",
                                  contact.status === "offline" && "bg-gray-400",
                                )}
                              />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{contact.name}</h3>
                                <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{contact.role}</p>
                              <p className="mt-1 truncate text-sm">{contact.lastMessage}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="absolute bottom-4 right-4">
                <Button onClick={handleNewConversation} className="rounded-full" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Chat area - shown on mobile only when a chat is opened */}
          <div className={cn(
            "col-span-2 flex flex-col",
            isMobileViewOpen ? "flex" : "hidden md:flex"
          )}>
            {/* Header */}
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
                    <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                    <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                      selectedContact.status === "online" && "bg-green-500",
                      selectedContact.status === "away" && "bg-yellow-500",
                      selectedContact.status === "offline" && "bg-gray-400",
                    )}
                  />
                </div>
                <div>
                  <h3 className="font-medium">{selectedContact.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-muted-foreground">{selectedContact.role}</p>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.status === "online" ? "Online" : 
                       selectedContact.status === "away" ? "Away" : "Offline"}
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
                        onClick={() => setIsCallModalOpen(true)}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Video call</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Search className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Search in conversation</p>
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
                    <DropdownMenuItem>Block contact</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Clear chat history</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea 
                className="h-[calc(100vh-26rem)]" 
                ref={messagesScrollAreaRef}
                onScrollCapture={handleMessagesScroll}
              >
                <div className="flex flex-col gap-3 p-4">
                  {Object.entries(messageManager.groupedMessages).map(([date, messages]) => (
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
                            <div className={cn(
                              "mb-1 rounded p-2 text-sm border-l-4 mx-6 bg-muted/50",
                              message.senderId === 0 ? "ml-12" : "mr-12"
                            )}>
                              <div className="flex items-center gap-2">
                                <Reply className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  Replying to {message.senderId === 0 ? selectedContact.name : "yourself"}
                                </span>
                              </div>
                              <p className="mt-1 text-xs truncate">
                                {messageManager.getMessageById(message.replyTo)?.text || "Original message not available"}
                              </p>
                            </div>
                          )}
                          
                          <div className={cn(
                            "flex items-start gap-3 px-4 py-2",
                            message.senderId === 0 ? "justify-end" : "justify-start"
                          )}>
                            {message.senderId !== 0 && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                                <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              "relative rounded-lg px-3 py-2 max-w-[85%]",
                              message.senderId === 0 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted text-foreground"
                            )}>
                              {messageManager.editingMessageId === message.id ? (
                                <div className="min-w-[200px]">
                                  <Textarea 
                                    value={messageManager.editText}
                                    onChange={(e) => messageManager.setEditText(e.target.value)}
                                    className="mb-2 min-h-[80px] bg-background/50"
                                    placeholder="Edit your message..."
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={messageManager.cancelEditingMessage}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={messageManager.saveEditedMessage}
                                      disabled={!messageManager.editText.trim()}
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
                                  
                                  {message.attachments?.map(attachment => (
                                    <div key={attachment.id}>
                                      {renderAttachmentPreview(attachment)}
                                    </div>
                                  ))}
                                  
                                  <div className={cn(
                                    "flex items-center gap-1 mt-1",
                                    message.senderId === 0 
                                      ? "justify-end text-primary-foreground/70" 
                                      : "justify-start text-muted-foreground"
                                  )}>
                                    <p className="text-[10px]">
                                      {message.timestamp}
                                    </p>
                                    
                                    {message.edited && (
                                      <>
                                        <span className="text-[10px]">•</span>
                                        <p className="text-[10px]">edited</p>
                                      </>
                                    )}
                                    
                                    {message.senderId === 0 && (
                                      <>
                                        <span className="text-[10px]">•</span>
                                        <p className="text-[10px]">
                                          {message.status === "sent" && "Sent"}
                                          {message.status === "delivered" && "Delivered"}
                                          {message.status === "read" && "Read"}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                              
                              {message.senderId === 0 && message.status === "read" && !messageManager.editingMessageId && (
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
                                    <DropdownMenuContent side="top" align="end">
                                      <DropdownMenuItem onClick={() => messageManager.startEditingMessage(message.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => messageManager.startReplyingToMessage(message.id)}>
                                        <Reply className="mr-2 h-4 w-4" />
                                        Reply
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => messageManager.deleteMessage(message.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                              
                              {message.senderId !== 0 && !messageManager.editingMessageId && (
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
                                    <DropdownMenuContent side="top" align="start">
                                      <DropdownMenuItem onClick={() => messageManager.startReplyingToMessage(message.id)}>
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
                                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Your avatar" />
                                <AvatarFallback>You</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {messageManager.isTyping && (
                    <div className="flex items-start gap-3 px-4 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                        <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex h-9 w-16 items-center justify-center gap-1 rounded-full bg-muted">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "200ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "400ms" }} />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
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
                        Replying to {
                          messageManager.getMessageById(messageManager.replyingToId)?.senderId === 0 
                            ? "yourself" 
                            : selectedContact.name
                        }
                      </span>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                        {messageManager.getMessageById(messageManager.replyingToId)?.text || ""}
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
                  {pendingAttachments.map(attachment => (
                    <div 
                      key={attachment.id} 
                      className="flex items-center gap-2 rounded-md border bg-background p-2"
                    >
                      <File className="h-4 w-4 text-muted-foreground" />
                      <div className="text-xs">
                        <p className="font-medium">{attachment.name}</p>
                        <p className="text-muted-foreground">{attachment.size}</p>
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
                  <DropdownMenu open={hasAttachmentOpen} onOpenChange={setHasAttachmentOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-r-none border-r-0">
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
                  
                  <DropdownMenu open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-l-none">
                        <SmilePlus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="flex flex-wrap p-2 w-64">
                      {["😊", "👍", "❤️", "😂", "😎", "🎉", "🤔", "😢", "🙏", "🔥", "✨", "🥳"].map(emoji => (
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
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  ref={messageInputRef}
                />
                
                <Button type="submit" size="icon" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video call modal */}
      <VideoCallModal
      // @ts-ignore
        open={isCallModalOpen} 
        onClose={() => setIsCallModalOpen(false)}
        contactName={selectedContact.name}
        contactAvatar={selectedContact.avatar}
      />
    </DashboardShell>
  )
}