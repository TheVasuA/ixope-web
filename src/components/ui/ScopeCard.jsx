import { useNavigate } from 'react-router-dom'
import { Eye, Ear, Scan, Microscope, Image, Video, ImageOff } from 'lucide-react'
import { useGetScopeStatsQuery, useGetScopeImagesQuery } from '../../services/api'
import { SCOPE_LABELS, SCOPE_COLORS, SERVER_URL } from '../../config/device'

const scopeIcons = { opth: Eye, oto: Ear, derm: Scan, micro: Microscope }

export default function ScopeCard({ scope }) {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useGetScopeStatsQuery(scope)
  const { data: imgData, isLoading: imgLoading } = useGetScopeImagesQuery(scope)
  const recentImages = (Array.isArray(imgData) ? imgData : (imgData?.images || [])).slice(0, 4)
  const Icon = scopeIcons[scope]
  const colors = SCOPE_COLORS[scope]
  const label = SCOPE_LABELS[scope]

  return (
    <div
      onClick={() => navigate(`/scope/${scope}`)}
      className={`medical-card w-full group cursor-pointer ${colors.bg}`}
    >
      <div className="flex flex-col items-center text-center lg:items-center lg:text-center">
        <div className={`p-3 rounded-xl ${colors.bg} ring-1 ${colors.ring}`}>
          <Icon size={24} className={colors.accent} />
        </div>
        <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-medical-600 dark:group-hover:text-medical-400 transition-colors">
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
      </div>

      {/* Recent 4 images */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {imgLoading ? (
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : recentImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            {recentImages.map((img) => {
              let rawUrl = (img.url || '').replace(/^\/api/, '')
              if (!rawUrl.startsWith('/captures')) rawUrl = `/captures${rawUrl}`
              const imgSrc = `${SERVER_URL}${rawUrl}`
              return (
                <img
                  key={img.id || img.filename}
                  src={imgSrc}
                  alt={img.original_filename || img.filename}
                  className="aspect-square object-cover rounded-md ring-1 ring-gray-200 dark:ring-gray-700"
                  loading="lazy"
                />
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-gray-400">
            <ImageOff size={20} />
            <p className="text-xs mt-1">No captures</p>
          </div>
        )}
      </div>
    </div>
  )
}

