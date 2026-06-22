import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setSidebarOpen } from '../../store/slices/uiSlice'
import { LayoutDashboard, Eye, Ear, Scan, Microscope, Video, Upload, FileText, Settings, X, Activity, Search } from 'lucide-react'
import { SCOPE_LABELS, SCOPE_COLORS } from '../../config/device'

const scopeIcons = { opth: Eye, oto: Ear, derm: Scan, micro: Microscope }

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { type: 'divider', label: 'Scopes' },
  { path: '/scope/opth', label: SCOPE_LABELS.opth, icon: Eye, scope: 'opth' },
  { path: '/scope/oto', label: SCOPE_LABELS.oto, icon: Ear, scope: 'oto' },
  { path: '/scope/derm', label: SCOPE_LABELS.derm, icon: Scan, scope: 'derm' },
  { path: '/scope/micro', label: SCOPE_LABELS.micro, icon: Microscope, scope: 'micro' },
  { type: 'divider', label: 'Tools' },
  { path: '/live', label: 'Live Feed', icon: Video },
  { path: '/examination', label: 'Examination', icon: Search },
  { path: '/reports', label: 'Reports', icon: FileText },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)

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
            <div className="w-8 h-8 rounded-lg bg-medical-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">iX</span>
            </div>
            <span className="font-semibold text-lg">IXOPE</span>
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
                      ? 'bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`
                }
              >
                <Icon size={18} className={scopeColor} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-surface-border">
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">IXOPE Medical v1.0</p>
        </div>
      </aside>
    </>
  )
}

