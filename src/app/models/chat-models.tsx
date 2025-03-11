export type Room = {id: number, name: string; addedBy?: number; uri?: string; unreadMessageCount?: number};
export type User = {id?: number; fullName: string; token?: string};
export type Message = {id?: number; userId: number; sender?: User; roomId: number; text: string; date: string;}
export type ApiResponse = {items: Room[] | User[]};
export type ApiRequest = {path: string; action: string; token?: string; data: any};
