import { useState, useEffect, useRef } from 'react'
import { Cpu, Image, Video, Users, Activity, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import { SERVER_URL } from '../../config/device'

export default function AdminDashboard() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const wsRef = useRef(null)

  // Fetch all devices from API
  useEffect(() => {
    fetch(`${SERVER_URL}/devices`)
      .then(res => res.json())
      .then(data => {
        setDevices(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // WebSocket for real-time device status
  useEffect(() => {
    const wsUrl = SERVER_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws/devices'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'device_status') {
        setDevices(prev => prev.map(d =>
          d.device_id === msg.device_id ? { ...d, is_online: msg.online, ip_address: msg.ip || d.ip_address } : d
        ))
      }
    }

    ws.onopen = () => {
      // Send ping every 30s to keep alive
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, 30000)
      ws._interval = interval
    }

    ws.onclose = () => clearInterval(ws._interval)

    return () => ws.close()
  }, [])

  const onlineCount = devices.filter(d => d.is_online).length

  const stats = [
    { label: 'Total Devices', value: devices.length, icon: Cpu, color: 'from-blue-500 to-cyan-500', change: `${onlineCount} online` },
    { label: 'Total Images', value: '—', icon: Image, color: 'from-emerald-500 to-green-500', change: 'from all devices' },
    { label: 'Total Videos', value: '—', icon: Video, color: 'from-purple-500 to-pink-500', change: 'from all devices' },
    { label: 'Active Users', value: '—', icon: Users, color: 'from-amber-500 to-orange-500', change: '' },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <TrendingUp size={12} className="text-green-500" /> {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                <stat.icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Devices Table — Real Data */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity size={18} className="text-medical-400" /> Connected Devices
          </h3>
          <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium">
            {onlineCount} Online
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading devices...</div>
          ) : devices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No devices registered yet</div>
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
                  <tr key={device.device_id || device.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      {device.is_online ? (
                        <span className="flex items-center gap-1.5 text-green-400">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <Wifi size={14} /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <WifiOff size={14} /> Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">IXOPE-{device.device_id}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{device.ip_address || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
