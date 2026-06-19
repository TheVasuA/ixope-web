import { useGetAllImagesQuery, useGetHealthQuery } from '../services/api'
import { SCOPES, POLLING_INTERVAL } from '../config/device'
import ScopeCard from '../components/ui/ScopeCard'
import { Activity, Camera, Wifi, WifiOff } from 'lucide-react'
import { SERVER_URL } from '../config/device'
import { formatRelativeTime } from '../utils/formatters'

export default function Dashboard() {
  const { data: health } = useGetHealthQuery(undefined, { pollingInterval: POLLING_INTERVAL })
  const { data: recentImages, isLoading } = useGetAllImagesQuery()
  const latestImages = (recentImages || []).slice(0, 8)
  const isOnline = health?.status === 'ok'

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">IXOPE Medical Imaging Overview</p>
      </div>

      {/* Scope Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCOPES.map((scope) => (
          <ScopeCard key={scope} scope={scope} />
        ))}
      </div>

      {/* Device Health + Recent Captures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Health */}
        <div className="medical-card">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={20} className="text-medical-500" />
            <h2 className="font-semibold">Device Status</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Connection</span>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Camera</span>
              <span className={`text-sm font-medium ${health?.camera === 'available' ? 'text-green-600' : 'text-gray-400'}`}>
                {health?.camera === 'available' ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Last Check</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {formatRelativeTime(health?.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Captures */}
        <div className="medical-card lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Camera size={20} className="text-medical-500" />
            <h2 className="font-semibold">Recent Captures</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : latestImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {latestImages.map((img) => (
                <img
                  key={img.filename}
                  src={`${SERVER_URL}${(img.url || '').replace(/^\/api/, '')}`}
                  alt={img.filename}
                  className="aspect-square object-cover rounded-lg ring-1 ring-gray-200 dark:ring-gray-700"
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No captures yet</p>
          )}
        </div>
      </div>
    </div>
  )
}


