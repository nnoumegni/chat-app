'use client'

import { create } from 'zustand';
import {User, Message, Room, AddRoom, RoomUser, DmRoom} from '../models/chat-models';
import {Utils} from "../helpers/utils";

interface AppState {
  user: User | null;
  socket: any; // Using any for socket since we don't have Socket.io types
  isAuthenticated: boolean | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  messages: Message[];
  rooms: (Room | AddRoom)[];  // Allow both Room and AddRoom types
  selectedRoom: Room | null;
  subscriptions: Record<string, Array<{callback: Function}>>;
  showAside: boolean;
  showMiniBox: boolean;
  users: User[];
  deviceId: string;
  showNewRoomForm: boolean;
  selectedUsers: RoomUser[];
  roomType: string;
  themeMode: string;
  toggleVideoCall: boolean;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  socket: null,
  isAuthenticated: undefined,
  isConnected: false,
  isConnecting: false,
  messages: [],
  rooms: [],
  selectedRoom: null,
  subscriptions: {},
  showAside: false,
  showMiniBox: false,
  users: [],
  deviceId: '',
  showNewRoomForm: false,
  selectedUsers: [],
  roomType: '',
  themeMode: 'light',
  toggleVideoCall: false,
  setUser: ({user}: {user?: User}) => set(() => {
    return {
      user,
    };
  }),
  setSocket: ({socket}: {socket: any}) => set(() => {
    return {
      socket,
    };
  }),
  setIsAuthenticated: ({isAuthenticated = false}) => set(() => {
    return {
      isAuthenticated,
    };
  }),
  setIsConnected: ({isConnected = false}) => set(() => {
    const global = (window as any);
    console.log({isConnected});
    if(typeof global.chatStatusHandler === 'function') {
      global.chatStatusHandler({isConnected});
    }

    return {
      isConnected,
    };
  }),
  setIsConnecting: ({isConnecting = false}) => set(() => {
    return {
      isConnecting,
    };
  }),
  setMessages: ({messages}: {messages: Message[]}) => set(() => {
    return {
      messages,
    };
  }),
  addMessage: ({message}: {message: Message}) => set((state: {messages: Message[]}) => {
    // If the message has a msgUri, check if it exists and update it
    if (message.msgUri) {
      const existingMessageIndex = state.messages.findIndex(msg => msg.msgUri === message.msgUri);
      if (existingMessageIndex !== -1) {
        // Update existing message
        const updatedMessages = [...state.messages];
        updatedMessages[existingMessageIndex] = message;
        return {
          messages: updatedMessages,
        };
      }
    }
    // If it's a new message, prepend it
    return {
      messages: [message, ...state.messages],
    };
  }),
  setRooms: ({rooms}: {rooms: (Room | AddRoom)[]}) => set(() => {
    return {
      rooms,
    };
  }),
  setSelectedRoom: ({room: selectedRoom}: {room: Room}) => set(() => {
    return {
      selectedRoom,
    };
  }),
  addRoom: ({room}: {room: AddRoom | Room}) => set((state: AppState) => {
    const others = state.rooms.filter(r => r.roomUri !== room.roomUri);
    const rooms = [room, ...others];
    return {
      rooms,
    };
  }),
  setSubscriptions: ({subscriptions}: {subscriptions: AppState['subscriptions']}) => set(() => {
    return {
      subscriptions,
    };
  }),
  setShowAside: ({showAside = false}) => set(() => {
    return {
      showAside,
    };
  }),
  setShowMiniBox: ({showMiniBox = false}) => set(() => {
    return {
      showMiniBox,
    };
  }),
  setUsers: ({users}: {users: User[]}) => set(() => {
    return {
      users,
    };
  }),
  setDeviceId: ({deviceId = ''}) => set(() => {
    return {
      deviceId,
    };
  }),
  setShowNewRoomForm: ({showNewRoomForm = false}) => set(() => {
    return {
      showNewRoomForm,
    };
  }),
  addSelectedUser: ({user}: {user: RoomUser}) => set((state: AppState) => {
    return {
      selectedUsers: [...state.selectedUsers, user],
    };
  }),
  setRoomType: ({roomType = ''}) => set(() => {
    return {
      roomType,
    };
  }),
  setThemeMode: ({themeMode = ''}) => set(() => {
    return {
      themeMode,
    };
  }),
  setToggleVideoCall: (toggleVideoCall: boolean) => set(() => {
    return {
      toggleVideoCall,
    };
  }),
}))
