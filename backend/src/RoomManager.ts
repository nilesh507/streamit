// RoomManager.ts
import { Room } from "./Room";
import { User } from "./User";

export class RoomManager {
    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map<string, Room>();
    }

    /**
     * Create a new room with the given ID and (optionally) max capacity.
     * Does nothing if the room already exists.
     */
    public createRoom(roomId: string, maxCapacity?: number): Room {
        if (!this.rooms.has(roomId)) {
            const room = new Room(roomId, maxCapacity);
            this.rooms.set(roomId, room);
        }
        // Return the existing or newly created room
        return this.rooms.get(roomId)!;
    }

    /**
     * Retrieve a room by ID.
     */
    public getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    /**
     * Delete a room from the manager.
     */
    public deleteRoom(roomId: string): boolean {
        return this.rooms.delete(roomId);
    }

    /**
     * Add a user to a specific room, creating the room if needed.
     * Returns `true` on success, `false` if the room is full.
     */
    public addUserToRoom(
        roomId: string,
        user: User,
        maxCapacity?: number
    ): boolean {
        let room = this.getRoom(roomId);
        if (!room) {
            room = this.createRoom(roomId, maxCapacity);
        }
        return room.addUser(user);
    }

    /**
     * Remove a user from a specific room.
     */
    public removeUserFromRoom(roomId: string, userId: string): boolean {
        const room = this.getRoom(roomId);
        if (!room) return false;
        return room.removeUser(userId);
    }

    /**
     * Utility to find which room a given user is in (if any).
     */
    public findUserRoom(userId: string): Room | undefined {
        for (const [_, room] of this.rooms) {
            if (room.getAllUsers().some((u) => u.id === userId)) {
                return room;
            }
        }
        return undefined;
    }

    /**
     * Print all rooms and their users.
     */
    public printRoomsState(): void {
        this.rooms.forEach((room, roomId) => {
            console.log(`Room ID: ${roomId}`);
            room.getAllUsers().forEach((user) => {
                console.log(`- User: ${user.id}`);
            });
        });
    }
}

/*
Map {
	"room123" => Room {
		id: "room123",
		users: Map {
			"user1" => User {
				id: "user1",
				name: "Alice",
				ws: [WebSocket Object]
			},
			"user2" => User {
				id: "user2",
				name: "Bob",
				ws: [WebSocket Object]
			}
		},
		maxCapacity: 5
	},
	
	"room456" => Room {
		id: "room456",
		users: Map {
			"user3" => User {
				id: "user3",
				name: "Charlie",
				ws: [WebSocket Object]
			},
			"user4" => User {
				id: "user4",
				name: "David",
				ws: [WebSocket Object]
			},
			"user5" => User {
				id: "user5",
				name: "Eve",
				ws: [WebSocket Object]
			}
		},
		maxCapacity: 5
	}
}

*/
