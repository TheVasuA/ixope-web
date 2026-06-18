import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar } from '../../store/slices/uiSlice'
import { logout } from '../../store/slices/authSlice'
import { useGetHealthQuery } from '../../services/api'
import { POLLING_INTERVAL } from '../../config/device'
import { Menu, Sun, Moon, Wifi, WifiOff, LogOut, User } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { formatRelativeTime } from '../../utils/formatters'
import { useState } from 'react'

export default function Header() {
  const dispatch = useDispatch()
  const { theme, toggle } = useTheme()
  const user = useSelector((state) => state.auth.user)
  const [showMenu, setShowMenu] = useState(false)
  const { data: health, isError } = useGetHealthQuery(undefined, {
    pollingInterval: POLLING_INTERVAL,
  })

  const isOnline = health?.status === 'ok' && !isError

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-surface-card/80 backdrop-blur-md border-b border-gray-200 dark:border-surface-border flex items-center justify-between px-4 md:px-6">
      {/* Left: hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right: status + user + theme */}
      <div className="flex items-center gap-3">
        {/* Device status */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isOnline
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User avatar + dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full ring-2 ring-medical-200 dark:ring-medical-800" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-medical-500 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
              )}
              <span className="text-sm font-medium hidden md:inline">{user.name}</span>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-surface-card border border-gray-200 dark:border-surface-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { dispatch(logout()); setShowMenu(false) }}
                    className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
