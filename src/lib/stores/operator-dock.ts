'use client';

import { create } from 'zustand';

import type { OperatorIntent, OperatorVisibleContext } from '@/types/platform/operator';

type OperatorDockState = {
  open: boolean;
  context?: OperatorVisibleContext;
  intent: OperatorIntent;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  openWithContext: (context: OperatorVisibleContext, intent?: OperatorIntent) => void;
};

export const useOperatorDock = create<OperatorDockState>((set) => ({
  open: false,
  intent: 'explain',
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
  openWithContext: (context, intent = 'explain') => set({ open: true, context, intent }),
}));
