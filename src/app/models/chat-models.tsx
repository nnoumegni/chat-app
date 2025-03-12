export type Room = {id?: number; name: string; uri?: string; unreadMessageCount?: number; type?: string; users?: RoomUser[]};
// In case of a DM room, the name should be set in advance
export type AddRoom = {addedBy: number; users: RoomUser[]; name?: string; roomUri?: string; type?: string, active?: number};
export type UpdateRoom = {roomUri?: string; active?: number; users?: RoomUser[]};
export type User = {id?: number; fullName: string; token?: string};
export type RoomUser = {userId: number; fullName: string; isConnected?: boolean; status?: number};
export type Message = {id?: number; userId: number; sender?: User; roomUri: string; text: string; date: string};
export type JoinRoomPayload = {user: User, roomUri: string};
export type ApiResponse = {items: Room[] | User[]};
export type ApiRequest = {path: string; action: string; token?: string; data: any};
