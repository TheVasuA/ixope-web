import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toggleSidebar } from '../../store/slices/uiSlice'
import { Menu, Sun, Moon, FileText } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

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

      {/* Right: reports + theme */}
      <div className="flex items-center gap-3">
        {/* Report button */}
        <button
          onClick={() => navigate('/reports')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
            bg-gradient-to-b from-medical-400 to-medical-600 text-white
            shadow-[0_4px_0_0_theme(colors.medical.700),0_6px_12px_-2px_rgba(0,0,0,0.25)]
            hover:shadow-[0_2px_0_0_theme(colors.medical.700),0_4px_8px_-2px_rgba(0,0,0,0.25)]
            hover:translate-y-[2px]
            active:shadow-[0_0px_0_0_theme(colors.medical.700),0_2px_4px_-2px_rgba(0,0,0,0.25)]
            active:translate-y-[4px]
            transition-all duration-100"
        >
          <FileText size={14} />
          <span>Reports</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
