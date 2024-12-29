"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// User.ts
const ws_1 = require("ws");
class User {
    constructor(id, name, socket) {
        this.id = id; // instead of passing i should randomly assign some id to the user
        this.name = name;
        this.socket = socket;
    }
    /**
     * Retrieve the user's socket (for sending messages).
     */
    getSocket() {
        if (this.socket.readyState !== ws_1.WebSocket.OPEN) {
            throw new Error(`WebSocket for user ${this.id} is not open.`);
        }
        return this.socket;
    }
}
exports.User = User;
