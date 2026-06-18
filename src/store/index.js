import { configureStore } from '@reduxjs/toolkit'
import { ixopeApi } from '../services/api'
import uiReducer from './slices/uiSlice'
import uploadReducer from './slices/uploadSlice'
import reportReducer from './slices/reportSlice'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    [ixopeApi.reducerPath]: ixopeApi.reducer,
    ui: uiReducer,
    upload: uploadReducer,
    report: reportReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(ixopeApi.middleware),
})

