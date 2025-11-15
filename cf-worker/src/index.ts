import { RoomDO, Env } from "./RoomDO";

export { RoomDO };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only upgrade /ws requests.
    if (url.pathname !== "/ws" || request.headers.get("Upgrade") !== "websocket") {
      return new Response("OK", { status: 200 });
    }

    const roomId = url.searchParams.get("roomId");
    if (!roomId) {
      return new Response("Missing roomId", { status: 400 });
    }

    // Get the Durable Object stub for the room.
    const id = env.ROOM_DO.idFromName(roomId);
    const stub = env.ROOM_DO.get(id);

    // Forward the request to the Durable Object.
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
