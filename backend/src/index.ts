// server index.ts
import { WebSocket, WebSocketServer } from "ws";
import { RoomManager } from "./RoomManager";
import { User } from "./User";
import { Room } from "./Room";

const wss = new WebSocketServer({ port: 8080 });
// const wss = new WebSocketServer({ port: 8080, host: "192.168.1.135" });

const roomManager = new RoomManager();

/**
 * Mapping from WebSocket to userId (so we can find the user later on close).
 */
const wsToUserIdMap = new Map<WebSocket, string>();

wss.on("connection", (ws) => {
    console.log("\n=== New WebSocket Connection ===");
    let connectionInfo = {
        userId: null as string | null,
        roomId: null as string | null
    };

    ws.on("message", (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log("\n=== Received WebSocket Message ===");
            console.log("From userId:", connectionInfo.userId || "Not yet identified");
            console.log("In roomId:", connectionInfo.roomId || "Not yet in room");
            console.log("Message type:", message.type);
            console.log("Message content:", JSON.stringify(message, null, 2));
            console.log("================================\n");

            handleUserMessage(message, ws);
        } catch (err) {
            console.error("Failed to parse message:", err);
            console.error("Raw message data:", data.toString());
            ws.send(JSON.stringify({
                type: "error",
                message: "Failed to parse message"
            }));
        }
    });

    ws.on("error", (error) => {
        console.error("WebSocket error for user:", connectionInfo.userId);
        console.error(error);
    });

    ws.on("close", () => {
        console.log("\n=== WebSocket Connection Closed ===");
        console.log("User ID:", connectionInfo.userId || "Not identified");
        console.log("Room ID:", connectionInfo.roomId || "Not in room");

        // 1. Find the userId for this WebSocket
        const userId = wsToUserIdMap.get(ws);
        if (!userId) {
            console.log("No userId associated with this WebSocket. Skipping cleanup.");
            return;
        }

        // 2. Find which room the user is in
        const room = roomManager.findUserRoom(userId);
        if (!room) {
            console.log(`User ${userId} was not in any room.`);
            return;
        }

        // 3. Remove them from the room
        roomManager.removeUserFromRoom(room.roomId, userId);
        console.log(`User ${userId} removed from room ${room.roomId}`);

        // Broadcast to the remaining users in that room that this user left
        room.broadcast(
            {
                type: "userLeft",
                userId,
            },
            // userId
        );

        // 4. Clean up the mapping
        wsToUserIdMap.delete(ws);
        console.log("=== Cleanup Complete ===\n");
    });
});

/**
 * Handle incoming messages
 */
function handleUserMessage(message: any, ws: WebSocket) {
    switch (message.type) {
        /**
         * { type: "joinRoom", userId: "user1", name: "Alice", roomId: "room1" }
         */
        case "joinRoom": {
            console.log("\n=== Handling Join Room Request ===");
            const { userId, name, roomId } = message;
            if (!userId || !roomId) {
                console.log("Error: Missing userId or roomId");
                ws.send(
                    JSON.stringify({
                        type: "error",
                        message: "Missing userId or roomId in joinRoom",
                    })
                );
                return;
            }

            console.log(`User ${userId} joining room ${roomId}`);

            // Create a User object and attempt to add to the room
            const user = new User(userId, name, ws);
            const success = roomManager.addUserToRoom(roomId, user, 5);
            if (!success) {
                console.log(`Error: Room ${roomId} is full`);
                ws.send(
                    JSON.stringify({
                        type: "error",
                        message: `Room ${roomId} is full`,
                    })
                );
                return;
            }

            // Store the mapping from this WebSocket to the userId
            wsToUserIdMap.set(ws, userId);

            // Acknowledge that the user joined the room
            const joinedMessage = {
                type: "joinedRoom",
                roomId,
                userId,
            };
            console.log("Sending joined confirmation:", joinedMessage);
            ws.send(JSON.stringify(joinedMessage));

            // Get existing users in the room and notify them
            const room = roomManager.getRoom(roomId);
            if (room) {
                console.log(`Current room state for ${roomId}:`, room);
                // Notify existing users about the new user
                room.broadcast(
                    {
                        type: "newUser",
                        fromUserId: userId,
                    },
                    userId // Exclude the sender
                );
            }

            console.log("=== Join Room Complete ===\n");
            break;
        }

        case "createOffer": {
            console.log("Handling createOffer message");
            const { fromUserId, toUserId, sdp } = message;
            console.log(`Forwarding offer: from=${fromUserId}, to=${toUserId}`);

            const room = roomManager.findUserRoom(fromUserId);
            if (!room) {
                console.error(`Room not found for user ${fromUserId}`);
                return;
            }
            console.log(`Found room: ${room.roomId}`);

            const targetUser = room.getUser(toUserId);
            if (!targetUser) {
                console.error(`Target user ${toUserId} not found in room ${room.roomId}`);
                return;
            }
            console.log(`Found target user: ${toUserId}`);

            const forwardMessage = {
                type: "createOffer",
                fromUserId,
                toUserId,
                sdp,
            };
            console.log("Forwarding offer message:", JSON.stringify(forwardMessage, null, 2));
            targetUser.getSocket().send(JSON.stringify(forwardMessage));
            console.log("Offer forwarded successfully");
            break;
        }

        case "createAnswer": {
            console.log("Handling createAnswer message");
            const { fromUserId, toUserId, sdp } = message;
            console.log(`Forwarding answer: from=${fromUserId}, to=${toUserId}`);

            const room = roomManager.findUserRoom(fromUserId);
            if (!room) {
                console.error(`Room not found for user ${fromUserId}`);
                return;
            }
            console.log(`Found room: ${room.roomId}`);

            const targetUser = room.getUser(toUserId);
            if (!targetUser) {
                console.error(`Target user ${toUserId} not found in room ${room.roomId}`);
                return;
            }
            console.log(`Found target user: ${toUserId}`);

            const forwardMessage = {
                type: "createAnswer",
                fromUserId,
                toUserId,
                sdp,
            };
            console.log("Forwarding answer message:", JSON.stringify(forwardMessage, null, 2));
            targetUser.getSocket().send(JSON.stringify(forwardMessage));
            console.log("Answer forwarded successfully");
            break;
        }

        case "iceCandidate": {
            console.log("Handling iceCandidate message");
            const { fromUserId, toUserId, candidate } = message;

            if (!fromUserId || !toUserId) {
                console.error("Missing fromUserId or toUserId in iceCandidate message");
                return;
            }
            
            if (fromUserId === toUserId) {
                console.warn("ICE candidate sender and receiver are the same. Ignoring.");
                return;
            }
            
            console.log(`Forwarding ICE candidate: from=${fromUserId}, to=${toUserId}`);

            const room = roomManager.findUserRoom(fromUserId);
            if (!room) {
                console.error(`Room not found for user ${fromUserId}`);
                return;
            }
            console.log(`Found room: ${room.roomId}`);

            // const targetUser = room.getUser(toUserId);
            const targetUser = room.getUser(toUserId);

            if (!targetUser) {
                console.error(`Target user ${toUserId} not found in room ${room.roomId}`);
                ws.send(
                    JSON.stringify({
                        type: "error",
                        message: `User ${toUserId} not found in room`,
                    })
                );
                return;
            }
            
            console.log(`Found target user: ${toUserId}`);

            const forwardMessage = {
                type: "iceCandidate",
                fromUserId,
                toUserId,
                candidate,
            };
            console.log("Forwarding ICE candidate message:", JSON.stringify(forwardMessage, null, 2));
            targetUser.getSocket().send(JSON.stringify(forwardMessage));
            console.log("ICE candidate forwarded successfully");
            break;
        }

        default: {
            console.warn(`Unknown message type: ${message.type}`);
            break;
        }
    }
}

console.log("WebSocket server running on ws://localhost:8080");





