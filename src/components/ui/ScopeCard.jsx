import { useNavigate } from 'react-router-dom'
import { Eye, Ear, Scan, Microscope, Image, Video } from 'lucide-react'
import { useGetScopeStatsQuery } from '../../services/api'
import { SCOPE_LABELS, SCOPE_COLORS } from '../../config/device'

const scopeIcons = { opth: Eye, oto: Ear, derm: Scan, micro: Microscope }

export default function ScopeCard({ scope }) {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useGetScopeStatsQuery(scope)
  const Icon = scopeIcons[scope]
  const colors = SCOPE_COLORS[scope]
  const label = SCOPE_LABELS[scope]

  return (
    <button
      onClick={() => navigate(`/scope/${scope}`)}
      className={`medical-card text-left w-full group cursor-pointer ${colors.bg}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colors.bg} ring-1 ${colors.ring}`}>
          <Icon size={24} className={colors.accent} />
        </div>
      </div>
      <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-medical-600 dark:group-hover:text-medical-400 transition-colors">
        {label}
      </h3>
      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {isLoading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <Image size={14} /> {stats?.images || 0}
            </span>
            <span className="flex items-center gap-1">
              <Video size={14} /> {stats?.videos || 0}
            </span>
          </>
        )}
      </div>
    </button>
  )
}

