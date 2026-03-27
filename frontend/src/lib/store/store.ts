import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import roleReducer from './slices/roleSlice'
import demoReducer from './slices/demoSlice'
import notificationsReducer from './slices/notificationsSlice'
import agentReducer from './slices/agentSlice'
import complaintsReducer from './slices/complaintsSlice'
import typeApprovalReducer from './slices/typeApprovalSlice'
import authReducer from './slices/authSlice'
import organisationsReducer from './slices/organisationsSlice'

const persistConfig = {
  key: 'bocra-root',
  storage,
  whitelist: ['role', 'notifications'],
}

const rootReducer = combineReducers({
  role: roleReducer,
  demo: demoReducer,
  notifications: notificationsReducer,
  agent: agentReducer,
  complaints: complaintsReducer,   // not persisted — always fetched fresh
  typeApproval: typeApprovalReducer, // not persisted — always fetched fresh
  auth: authReducer,               // not persisted — reloaded from session cookie
  organisations: organisationsReducer, // not persisted — always fetched fresh
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
