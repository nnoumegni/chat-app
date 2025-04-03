'use client'

import { create } from 'zustand';
import {User, Message, Room, AddRoom, RoomUser, DmRoom} from '../models/chat-models';
import {Utils} from "../helpers/utils";

export const useAppStore = create((set) => ({
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
  setUser: ({user}: {user?: User}) => set(() => {
    return {
      user,
    };
  }),
  setSocket: ({socket}) => set(() => {
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
    return {
      messages: [message, ...state.messages],
    };
  }),
  setRooms: ({rooms}: {rooms: Room[]}) => set(() => {
    return {
      rooms,
    };
  }),
  setSelectedRoom: ({room: selectedRoom}: {room: Room}) => set(() => {
    return {
      selectedRoom,
    };
  }),
  addRoom: ({room}: {room: AddRoom}) => set((state: {rooms: AddRoom[]}) => {
    const others = state.rooms.filter(r => r.roomUri !== room.roomUri);
    const rooms = [room, ...others];
    return {
      rooms,
    };
  }),
  setSubscriptions: ({subscriptions}) => set((state) => {
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
  addSelectedUser: ({user}: {user: RoomUser | DmRoom}) => set((state: {selectedUsers: RoomUser[]}) => {
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
}))
