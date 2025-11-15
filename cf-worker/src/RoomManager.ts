// import { Room } from "./Room";
// import { User } from "./User";

// export class RoomManager {
//   private rooms = new Map<string, Room>();

//   createRoom(roomId: string, maxCapacity?: number): Room {
//     if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Room(roomId, maxCapacity));
//     return this.rooms.get(roomId)!;
//   }
//   getRoom(roomId: string): Room | undefined { return this.rooms.get(roomId); }

//   addUserToRoom(roomId: string, user: User, maxCapacity?: number): boolean {
//     const room = this.getRoom(roomId) ?? this.createRoom(roomId, maxCapacity);
//     return room.addUser(user);
//   }
//   removeUserFromRoom(roomId: string, userId: string): boolean {
//     const room = this.getRoom(roomId);
//     return room ? room.removeUser(userId) : false;
//   }
//   findUserRoom(userId: string): Room | undefined {
//     for (const room of this.rooms.values()) {
//       if (room.getAllUsers().some(u => u.id === userId)) return room;
//     }
//     return undefined;
//   }
// }
