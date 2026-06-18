import { createSlice } from '@reduxjs/toolkit'

const storedUser = localStorage.getItem('ixope-user')

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedUser,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('ixope-user', JSON.stringify(action.payload))
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('ixope-user')
    },
  },
})

export const { setUser, logout } = authSlice.actions
export default authSlice.reducer
