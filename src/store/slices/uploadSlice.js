import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  queue: [],
  history: [],
}

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    addToQueue(state, action) {
      state.queue.push(...action.payload)
    },
    updateUploadStatus(state, action) {
      const { id, status, progress, error } = action.payload
      const item = state.queue.find((i) => i.id === id)
      if (item) {
        item.status = status
        if (progress !== undefined) item.progress = progress
        if (error !== undefined) item.error = error
      }
    },
    removeFromQueue(state, action) {
      state.queue = state.queue.filter((i) => i.id !== action.payload)
    },
    retryAllFailed(state) {
      state.queue.forEach((item) => {
        if (item.status === 'error') {
          item.status = 'pending'
          item.progress = 0
          item.error = undefined
        }
      })
    },
    moveToHistory(state, action) {
      const item = state.queue.find((i) => i.id === action.payload)
      if (item) {
        state.history.unshift({ ...item, completedAt: new Date().toISOString() })
        state.queue = state.queue.filter((i) => i.id !== action.payload)
      }
    },
    clearHistory(state) {
      state.history = []
    },
  },
})

export const { addToQueue, updateUploadStatus, removeFromQueue, retryAllFailed, moveToHistory, clearHistory } = uploadSlice.actions
export default uploadSlice.reducer

