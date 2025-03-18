export type Room = {id?: number; name: string; uri?: string; unreadMessageCount?: number; type?: string; users?: RoomUser[]; dmUser?: RoomUser};
// In case of a DM room, the name should be set in advance
export type AddRoom = {addedBy: number; users: RoomUser[]; name?: string; roomUri?: string; type?: string, active?: number};
export type DmRoom = AddRoom;
export type UpdateRoom = {roomUri?: string; active?: number; users?: RoomUser[]};
export type User = {id?: number; fullname: string; token?: string};
export type RoomUser = {userId: number; fullname: string; isConnected?: boolean; status?: number};
export type Message = {
    id?: number;
    userId: number;
    sender?: User;
    roomUri: string;
    text: string;
    date: string,
    msgUri?: string;
    type?: string;
    users?: RoomUser[],
    sent?: boolean;
    seen?: boolean;
    deleted?: boolean
};
export type JoinRoomPayload = {user: User, roomUri: string};
export type ApiResponse = {items: Room[] | User[]};
export type ApiRequest = {path: string; action: string; token?: string; data: any};

// Left menu item can be of 3 types
export type LeftNavItem = Room | DmRoom | User;
