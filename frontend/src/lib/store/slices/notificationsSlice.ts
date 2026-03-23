import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Notification {
  id: string
  type:
    | 'APPLICATION_UPDATE'
    | 'COMPLAINT_UPDATE'
    | 'PAYMENT_DUE'
    | 'CERTIFICATE_READY'
    | 'LICENCE_RENEWAL'
    | 'SYSTEM'
  title: string
  body: string
  isRead: boolean
  timestamp: string
  moduleLink?: string
}

interface NotificationsState {
  items: Notification[]
  unreadCount: number
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.items = action.payload
      state.unreadCount = action.payload.filter((n) => !n.isRead).length
    },
    markAsRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload)
      if (item && !item.isRead) {
        item.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead(state) {
      state.items.forEach((n) => {
        n.isRead = true
      })
      state.unreadCount = 0
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload)
      if (!action.payload.isRead) {
        state.unreadCount += 1
      }
    },
  },
})

export const { setNotifications, markAsRead, markAllAsRead, addNotification } =
  notificationsSlice.actions
export default notificationsSlice.reducer
