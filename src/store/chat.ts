import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  explore_request?: Record<string, unknown>;
  explore_result?: Record<string, unknown>;
  suggested_chart_type?: string;
  confidence?: number;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  isOpen: boolean;

  addMessage: (msg: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  loading: false,
  isOpen: false,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (loading) => set({ loading }),
  setOpen: (isOpen) => set({ isOpen }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  clear: () => set({ messages: [], loading: false }),
}));
