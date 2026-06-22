import { useState, useEffect } from 'react'
import { Cpu, Image, Video, HardDrive, Activity, TrendingUp, Wifi, WifiOff, Eye, Ear, Scan, Microscope } from 'lucide-react'
import { SERVER_URL } from '../../config/device'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(1)} ${units[i]}`
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const scopeIcons = { opth: Eye, oto: Ear, derm: Scan, micro: Microscope }
const scopeLabels = { opth: 'Ophthalmoscope', oto: 'Otoscope', derm: 'Dermatoscope', micro: 'Microscope' }

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${SERVER_URL}/admin/stats`).then(r => r.json()).catch(() => null),
      fetch(`${SERVER_URL}/devices`).then(r => r.json()).catch(() => []),
    ]).then(([statsData, devicesData]) => {
      setStats(statsData)
      setDevices(Array.isArray(devicesData) ? devicesData : [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const onlineCount = devices.filter(d => d.is_online).length

  const statCards = [
    { label: 'Total Devices', value: stats?.total_devices || devices.length, icon: Cpu, color: 'from-blue-500 to-cyan-500', sub: `${onlineCount} online` },
    { label: 'Total Images', value: stats?.total_images || 0, icon: Image, color: 'from-emerald-500 to-green-500', sub: 'all devices' },
    { label: 'Total Videos', value: stats?.total_videos || 0, icon: Video, color: 'from-purple-500 to-pink-500', sub: 'all devices' },
    { label: 'Storage Used', value: formatBytes(stats?.total_storage_bytes), icon: HardDrive, color: 'from-amber-500 to-orange-500', sub: 'images + videos' },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <TrendingUp size={12} className="text-green-500" /> {stat.sub}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scope Breakdown */}
      {stats?.scope_stats && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-medical-400" /> Captures by Scope
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.scope_stats.map((s) => {
              const ScopeIcon = scopeIcons[s.scope]
              return (
                <div key={s.scope} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ScopeIcon size={16} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-300">{scopeLabels[s.scope]}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold">{s.images}</span>
                    <span className="text-xs text-gray-500">images</span>
                    <span className="text-lg font-bold">{s.videos}</span>
                    <span className="text-xs text-gray-500">videos</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Devices Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Cpu size={18} className="text-medical-400" /> Connected Devices
          </h3>
          <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium">
            {onlineCount} Online
          </span>
        </div>
        <div className="overflow-x-auto">
          {devices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No devices registered</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Device</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.device_id || device.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      {device.is_online ? (
                        <span className="flex items-center gap-1.5 text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><Wifi size={14} /> Online</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-500"><WifiOff size={14} /> Offline</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">IXOPE-{device.device_id}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{device.ip_address || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{timeAgo(device.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recent_images?.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Captures</h3>
          <div className="space-y-2">
            {stats.recent_images.map((img) => (
              <div key={img.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
                    <Image size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{img.filename}</p>
                    <p className="text-xs text-gray-500">Device {img.device_id} · {img.scope?.toUpperCase()}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{timeAgo(img.captured_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
