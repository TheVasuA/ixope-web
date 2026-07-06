import { createSlice } from '@reduxjs/toolkit'

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours

const storedUser = localStorage.getItem('ixope-user')
const loginTime = localStorage.getItem('ixope-login-time')

// Check if session is still valid
const isSessionValid = storedUser && loginTime && (Date.now() - parseInt(loginTime, 10)) < SESSION_DURATION_MS

// Clear expired session
if (storedUser && !isSessionValid) {
  localStorage.removeItem('ixope-user')
  localStorage.removeItem('ixope-token')
  localStorage.removeItem('ixope-login-time')
}

const initialState = {
  user: isSessionValid ? JSON.parse(storedUser) : null,
  isAuthenticated: !!isSessionValid,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('ixope-user', JSON.stringify(action.payload))
      localStorage.setItem('ixope-login-time', String(Date.now()))
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('ixope-user')
      localStorage.removeItem('ixope-token')
      localStorage.removeItem('ixope-login-time')
    },
  },
})

export const { setUser, logout } = authSlice.actions
export default authSlice.reducer
