import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Room {
  id: string;
  callSessionId: string;
  participants: Set<string>;
  createdAt: Date;
}

class VideoRoomManager {
  private rooms: Map<string, Room> = new Map();

  // Create a new room
  async createRoom(
    creatorId: string,
    participantIds: string[] = [],
    conversationId: string
  ): Promise<Room> {
    // Create call session in database
    // @ts-ignore
    const callSession = await prisma.callSession.create({
      data: {
        roomId: generateRoomId(),
        participants: [creatorId, ...participantIds],
        messages: {
          create: {
            senderId: creatorId,
            conversationId,
            content: "Video call started",
            messageType: "CALL_STARTED",
          },
        },
      },
    });

    const room: Room = {
      id: callSession.roomId,
      callSessionId: callSession.id,
      participants: new Set([creatorId]),
      createdAt: new Date(),
    };

    this.rooms.set(room.id, room);
    return room;
  }

  // Get a room by ID
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  // Add a participant to a room
  async addParticipant(roomId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.participants.add(userId);

    // Update the database
    // @ts-ignore
    await prisma.callSession.update({
      where: { id: room.callSessionId },
      data: {
        participants: {
          push: userId,
        },
      },
    });

    return true;
  }

  // Remove a participant from a room
  removeParticipant(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.participants.delete(userId);

    // If room is empty, close it
    if (room.participants.size === 0) {
      this.closeRoom(roomId);
    }

    return true;
  }

  // Close a room
  async closeRoom(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Calculate duration
    const durationSeconds = Math.floor(
      (Date.now() - room.createdAt.getTime()) / 1000
    );

    // Update the database
    // @ts-ignore
    await prisma.callSession.update({
      where: { id: room.callSessionId },
      data: {
        endedAt: new Date(),
        duration: durationSeconds,
      },
    });

    this.rooms.delete(roomId);
    return true;
  }

  // Get all active rooms
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  // Get rooms where a user is a participant
  getUserRooms(userId: string): Room[] {
    return this.getAllRooms().filter((room) => room.participants.has(userId));
  }
}

// Generate a unique room ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 12);
}

// Export singleton instance
export const videoRoomManager = new VideoRoomManager();
