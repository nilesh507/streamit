"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    constructor(roomId, maxCapacity = 5) {
        this.roomId = roomId;
        this.maxCapacity = maxCapacity;
        this.users = new Map();
    }
    /**
     * Add a user to the room.
     * Ensures the room does not exceed its maximum capacity.
     * @param user - The user to be added to the room.
     * @returns A boolean indicating if the user was successfully added.
     */
    addUser(user) {
        if (this.users.size >= this.maxCapacity)
            return false; // Room is full
        this.users.set(user.id, user);
        return true;
    }
    /**
     * Remove a user from the room by their ID.
     * @param userId - The ID of the user to be removed.
     * @returns A boolean indicating if the removal was successful.
     */
    removeUser(userId) {
        return this.users.delete(userId);
    }
    /**
     * Retrieve all users currently in the room.
     * @returns An array of User objects representing all users in the room.
     */
    getAllUsers() {
        return Array.from(this.users.values());
    }
    /**
     * Get a specific user in the room by their ID.
     * @param userId - The ID of the user to retrieve.
     * @returns The User object if found, otherwise undefined.
     */
    getUser(userId) {
        return this.users.get(userId); // Efficient lookup in the Map
    }
    /**
     * Broadcast a message to all users in the room.
     * Optionally exclude a specific user from receiving the message.
     * @param message - The message to broadcast.
     * @param excludeUserId - (Optional) The ID of the user to exclude.
     */
    broadcast(message, excludeUserId) {
        this.users.forEach((user) => {
            if (excludeUserId && user.id === excludeUserId)
                return;
            try {
                user.getSocket().send(JSON.stringify(message));
            }
            catch (err) {
                console.error(`Error broadcasting to user ${user.id}:`, err);
            }
        });
    }
    /**
     * Log the current state of the room, including users and their details.
     */
    debugState() {
        console.log(`Room: ${this.roomId}`);
        console.log(`Max Capacity: ${this.maxCapacity}`);
        console.log(`Users (${this.users.size}):`);
        this.users.forEach((user) => {
            console.log(`- ID: ${user.id}, Name: ${user.name || "N/A"}`);
        });
    }
}
exports.Room = Room;
