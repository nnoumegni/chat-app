export interface Message {
    text: string;
    userId: number;
    roomUri: string;
    date: string;
    msgUri: string;
    type: string;
    sender?: {
        userId: number;
        fullname: string;
        thumb?: string;
    };
    receiver?: {
        userId: number;
        fullname: string;
        thumb?: string;
    };
    reactions?: {
        emoji: string;
        count: number;
        users: number[];
    }[];
} 