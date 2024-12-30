'use client'

import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: {},
  showAuthPage: true,
  setUser: ({payload, action}) => set((state) => {
    return {
      user: {...state.user, ...payload},
    } ;
  }),
  setShowAuthPage: () => set((state) => {
    return {
      showAuthPage: !(state.user.username && state.user.password)
    } ;
  }),
}))
