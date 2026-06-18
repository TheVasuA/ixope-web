import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: localStorage.getItem('ixope-theme') || 'dark',
  sidebarOpen: false,
  activeScope: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('ixope-theme', state.theme)
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    setTheme(state, action) {
      state.theme = action.payload
      localStorage.setItem('ixope-theme', state.theme)
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload
    },
    setActiveScope(state, action) {
      state.activeScope = action.payload
    },
  },
})

export const { toggleTheme, setTheme, toggleSidebar, setSidebarOpen, setActiveScope } = uiSlice.actions
export default uiSlice.reducer

