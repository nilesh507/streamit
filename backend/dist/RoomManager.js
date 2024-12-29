"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
// RoomManager.ts
const Room_1 = require("./Room");
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    /**
     * Create a new room with the given ID and (optionally) max capacity.
     * Does nothing if the room already exists.
     */
    createRoom(roomId, maxCapacity) {
        if (!this.rooms.has(roomId)) {
            const room = new Room_1.Room(roomId, maxCapacity);
            this.rooms.set(roomId, room);
        }
        // Return the existing or newly created room
        return this.rooms.get(roomId);
    }
    /**
     * Retrieve a room by ID.
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    /**
     * Delete a room from the manager.
     */
    deleteRoom(roomId) {
        return this.rooms.delete(roomId);
    }
    /**
     * Add a user to a specific room, creating the room if needed.
     * Returns `true` on success, `false` if the room is full.
     */
    addUserToRoom(roomId, user, maxCapacity) {
        let room = this.getRoom(roomId);
        if (!room) {
            room = this.createRoom(roomId, maxCapacity);
        }
        return room.addUser(user);
    }
    /**
     * Remove a user from a specific room.
     */
    removeUserFromRoom(roomId, userId) {
        const room = this.getRoom(roomId);
        if (!room)
            return false;
        return room.removeUser(userId);
    }
    /**
     * Utility to find which room a given user is in (if any).
     */
    findUserRoom(userId) {
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
    printRoomsState() {
        this.rooms.forEach((room, roomId) => {
            console.log(`Room ID: ${roomId}`);
            room.getAllUsers().forEach((user) => {
                console.log(`- User: ${user.id}`);
            });
        });
    }
}
exports.RoomManager = RoomManager;
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
