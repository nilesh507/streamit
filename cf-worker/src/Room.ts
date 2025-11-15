// import { User } from "./User";
// import type { Outbound } from "./types";

// export class Room {
//   private users = new Map<string, User>();
//   constructor(public roomId: string, public maxCapacity: number = 5) {}

//   addUser(user: User): boolean {
//     if (this.users.size >= this.maxCapacity) return false;
//     this.users.set(user.id, user);
//     return true;
//   }
//   removeUser(userId: string): boolean { return this.users.delete(userId); }
//   getAllUsers(): User[] { return Array.from(this.users.values()); }
//   getUser(userId: string): User | undefined { return this.users.get(userId); }

//   broadcast(message: Outbound, excludeUserId?: string): void {
//     console.log("Broadcasting message:", message, excludeUserId);
//     const payload = JSON.stringify(message);
//     for (const user of this.users.values()) {
//       if (excludeUserId && user.id === excludeUserId) continue;
//       try { 
//         user.getSocket().send(payload); 
//       } catch (error) {
//         console.error("Failed to send message to user:", user.id, error);
//       }
//     }
//   }
// }
