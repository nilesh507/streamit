import { User } from "./User";
import type { Inbound, Outbound } from "./types";

export class RoomDO implements DurableObject {
  private users = new Map<string, User>();
  private sockets = new Map<string, WebSocket>();

  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const name = url.searchParams.get("name") || undefined;
    const roomId = url.searchParams.get("roomId");

    if (!userId || !roomId) {
      return new Response("Missing userId or roomId", { status: 400 });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }

    if (this.users.size >= 5) {
      return new Response("Room is full", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    const user = new User(userId, name);
    this.users.set(userId, user);
    this.sockets.set(userId, server);

    // Announce the new user to others
    this.broadcast({ type: "newUser", fromUserId: userId }, userId);

    server.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data as string) as Inbound;
        this.handleUserMessage(userId, message);
      } catch (e) {
        server.send(JSON.stringify({ type: "error", message: "Failed to parse message" }));
      }
    });

    const closeOrErrorHandler = () => {
      this.users.delete(userId);
      this.sockets.delete(userId);
      this.broadcast({ type: "userLeft", userId: userId });
    };

    server.addEventListener("close", closeOrErrorHandler);
    server.addEventListener("error", closeOrErrorHandler);

    // Send the current list of users to the new user
    const existingUsers = Array.from(this.users.values()).filter(u => u.id !== userId);
    const message: Outbound = { type: "existingUsers", users: existingUsers.map(u => ({id: u.id, name: u.name})) };
    server.send(JSON.stringify(message));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleUserMessage(fromUserId: string, message: Inbound) {
    switch (message.type) {
      case "createOffer":
      case "createAnswer":
      case "iceCandidate": {
        const targetSocket = this.sockets.get(message.toUserId);
        if (targetSocket) {
          const outboundMessage: Outbound = { ...message, fromUserId };
          targetSocket.send(JSON.stringify(outboundMessage));
        }
        break;
      }
    }
  }

  broadcast(message: Outbound, excludeUserId?: string) {
    const payload = JSON.stringify(message);
    for (const [userId, socket] of this.sockets.entries()) {
      if (userId !== excludeUserId) {
        try {
          socket.send(payload);
        } catch (e) {
          // Could be that the socket is closed, remove it
          this.users.delete(userId);
          this.sockets.delete(userId);
        }
      }
    }
  }
}

export interface Env {
  ROOM_DO: DurableObjectNamespace;
}
