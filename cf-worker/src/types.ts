export type JoinRoom     = { type: "joinRoom"; userId: string; name?: string; roomId: string };
export type JoinedRoom   = { type: "joinedRoom"; userId: string; roomId: string };
export type NewUser      = { type: "newUser"; fromUserId: string };
export type ExistingUsers = { type: "existingUsers", users: {id: string, name?: string}[] };

export type CreateOffer  = { type: "createOffer"; fromUserId: string; toUserId: string; sdp: unknown };
export type CreateAnswer = { type: "createAnswer"; fromUserId: string; toUserId: string; sdp: unknown };
export type IceCandidate = { type: "iceCandidate"; fromUserId: string; toUserId: string; candidate: unknown };

export type UserLeft     = { type: "userLeft"; userId: string };
export type ErrorMsg     = { type: "error"; message: string };

export type Inbound  = CreateOffer | CreateAnswer | IceCandidate;
export type Outbound = JoinedRoom | NewUser | ExistingUsers | CreateOffer | CreateAnswer | IceCandidate | UserLeft | ErrorMsg;
