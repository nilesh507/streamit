// User.ts
import { WebSocket } from "ws";

export class User {
    public id: string;
    public name: string;
    private socket: WebSocket;

    constructor(id: string, name: string, socket: WebSocket) {
        this.id = id; // instead of passing i should randomly assign some id to the user
        this.name = name;
        this.socket = socket;
    }

    /**
     * Retrieve the user's socket (for sending messages).
     */
    public getSocket(): WebSocket {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error(`WebSocket for user ${this.id} is not open.`);
        }
        return this.socket;
    }
}
