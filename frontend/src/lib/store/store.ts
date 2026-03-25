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

const persistConfig = {
  key: 'bocra-root',
  storage,
  whitelist: ['role', 'demo', 'notifications'],
}

const rootReducer = combineReducers({
  role: roleReducer,
  demo: demoReducer,
  notifications: notificationsReducer,
  agent: agentReducer,
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
