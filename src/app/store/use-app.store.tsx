'use client'

import { create } from 'zustand';

export const useAppStore = create((set) => ({
  user: null,
  socket: null,
  isAuthenticated: false,
  isConnected: false,
  isConnecting: false,
  messages: [],
  rooms: [],
  selectedRoom: null,
  subscriptions: {},
  setUser: ({user}) => set(() => {
    return {
      user,
    };
  }),
  setSocket: ({socket}) => set(() => {
    return {
      socket,
    };
  }),
  setIsAuthenticated: ({isAuthenticated}) => set(() => {
    return {
      isAuthenticated,
    };
  }),
  setIsConnected: ({isConnected}) => set(() => {
    return {
      isConnected,
    };
  }),
  setIsConnecting: ({isConnecting}) => set(() => {
    return {
      isConnecting,
    };
  }),
  setMessages: ({messages}) => set(() => {
    return {
      messages,
    };
  }),
  addMessage: ({message}) => set((state) => {
    return {
      messages: [...state.messages, message],
    };
  }),
  setRooms: ({rooms}) => set(() => {
    return {
      rooms,
    };
  }),
  setSelectedRoom: ({room: selectedRoom}) => set(() => {
    return {
      selectedRoom,
    };
  }),
  addRoom: ({room}) => set((state) => {
    return {
      rooms: [room, ...state.rooms],
    };
  }),
  setSubscriptions: ({subscriptions}) => set((state) => {
    return {
      subscriptions,
    };
  }),
}))
