import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  timestamp: string
}

export interface Thread {
  id: string
  title: string
  createdAt: string
  messages: Message[]
}

interface AgentState {
  threads: Thread[]
  activeThreadId: string | null
  isStreaming: boolean
}

const initialState: AgentState = {
  threads: [],
  activeThreadId: null,
  isStreaming: false,
}

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    createThread(state, action: PayloadAction<Thread>) {
      state.threads.push(action.payload)
    },
    setActiveThread(state, action: PayloadAction<string>) {
      state.activeThreadId = action.payload
    },
    addMessage(
      state,
      action: PayloadAction<{ threadId: string; message: Message }>
    ) {
      const thread = state.threads.find((t) => t.id === action.payload.threadId)
      if (thread) {
        thread.messages.push(action.payload.message)
      }
    },
    updateLastMessage(
      state,
      action: PayloadAction<{ threadId: string; content: string }>
    ) {
      const thread = state.threads.find((t) => t.id === action.payload.threadId)
      if (thread && thread.messages.length > 0) {
        thread.messages[thread.messages.length - 1].content =
          action.payload.content
      }
    },
    setIsStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload
    },
    clearThread(state, action: PayloadAction<string>) {
      const thread = state.threads.find((t) => t.id === action.payload)
      if (thread) {
        thread.messages = []
      }
    },
  },
})

export const {
  createThread,
  setActiveThread,
  addMessage,
  updateLastMessage,
  setIsStreaming,
  clearThread,
} = agentSlice.actions
export default agentSlice.reducer
