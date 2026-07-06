import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setSidebarOpen } from '../../store/slices/uiSlice'
import { logout } from '../../store/slices/authSlice'
import { LayoutDashboard, Eye, Ear, Scan, Microscope, Video, FileText, X, Search, LogOut, User, Trash2 } from 'lucide-react'
import { SCOPE_LABELS, SCOPE_COLORS } from '../../config/device'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { type: 'divider', label: 'Scopes' },
  { path: '/scope/opth', label: SCOPE_LABELS.opth, icon: Eye, scope: 'opth' },
  { path: '/scope/oto', label: SCOPE_LABELS.oto, icon: Ear, scope: 'oto' },
  { path: '/scope/derm', label: SCOPE_LABELS.derm, icon: Scan, scope: 'derm' },
  { path: '/scope/micro', label: SCOPE_LABELS.micro, icon: Microscope, scope: 'micro' },
  { type: 'divider', label: 'Tools' },
  { path: '/examination', label: 'Examination', icon: Search },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/trash', label: 'Trash', icon: Trash2 },
  { path: '/live', label: 'Live Feed', icon: Video },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)
  const user = useSelector((state) => state.auth.user)

  const closeSidebar = () => dispatch(setSidebarOpen(false))

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-surface-card border-r border-gray-200 dark:border-surface-border flex flex-col transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 dark:border-surface-border">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="IXOPE" className="h-9" />
          </div>
          <button onClick={closeSidebar} className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, idx) => {
            if (item.type === 'divider') {
              return (
                <div key={idx} className="pt-4 pb-2 px-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {item.label}
                  </span>
                </div>
              )
            }

            const Icon = item.icon
            const scopeColor = item.scope ? SCOPE_COLORS[item.scope]?.accent : ''

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-medical-500 dark:bg-medical-600 text-white shadow-md shadow-medical-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={18} className={scopeColor} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div className="p-4 border-t border-gray-200 dark:border-surface-border">
            <div className="flex items-center gap-3 mb-3">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-medical-500/20 flex items-center justify-center">
                  <User size={14} className="text-medical-600 dark:text-medical-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
