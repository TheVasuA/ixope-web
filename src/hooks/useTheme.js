import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { toggleTheme, setTheme } from '../store/slices/uiSlice'

export function useTheme() {
  const dispatch = useDispatch()
  const theme = useSelector((state) => state.ui.theme)

  useEffect(() => {
    // Initialize theme on mount
    const stored = localStorage.getItem('ixope-theme')
    if (stored === 'dark' || stored === 'light') {
      dispatch(setTheme(stored))
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      dispatch(setTheme(prefersDark ? 'dark' : 'light'))
    }
  }, [dispatch])

  const toggle = () => dispatch(toggleTheme())

  return { theme, toggle }
}

