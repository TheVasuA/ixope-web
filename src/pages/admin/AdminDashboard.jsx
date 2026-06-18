import { Cpu, Image, Video, Users, Activity, TrendingUp, Wifi, WifiOff } from 'lucide-react'

export default function AdminDashboard() {
  // Mock data — will connect to API
  const stats = [
    { label: 'Total Devices', value: '12', icon: Cpu, color: 'from-blue-500 to-cyan-500', change: '+2 this month' },
    { label: 'Total Images', value: '4,821', icon: Image, color: 'from-emerald-500 to-green-500', change: '+142 today' },
    { label: 'Total Videos', value: '386', icon: Video, color: 'from-purple-500 to-pink-500', change: '+18 today' },
    { label: 'Active Users', value: '8', icon: Users, color: 'from-amber-500 to-orange-500', change: '3 online now' },
  ]

  const devices = [
    { id: '1001', name: 'IXOPE-1001', online: true, ip: '192.168.1.101', lastSeen: '2 min ago', images: 842, videos: 56 },
    { id: '1002', name: 'IXOPE-1002', online: true, ip: '192.168.1.102', lastSeen: '1 min ago', images: 1203, videos: 89 },
    { id: '1003', name: 'IXOPE-1003', online: false, ip: '192.168.1.103', lastSeen: '3 hours ago', images: 567, videos: 34 },
    { id: '1004', name: 'IXOPE-1004', online: false, ip: '10.0.0.50', lastSeen: '1 day ago', images: 2209, videos: 207 },
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

      {/* Devices Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity size={18} className="text-medical-400" /> Connected Devices
          </h3>
          <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium">
            {devices.filter(d => d.online).length} Online
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Device</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3">Last Seen</th>
                <th className="px-6 py-3">Images</th>
                <th className="px-6 py-3">Videos</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    {device.online ? (
                      <span className="flex items-center gap-1.5 text-green-400">
                        <Wifi size={14} /> Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <WifiOff size={14} /> Offline
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-gray-500">ID: {device.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{device.ip}</td>
                  <td className="px-6 py-4 text-gray-400">{device.lastSeen}</td>
                  <td className="px-6 py-4 text-gray-300">{device.images.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-300">{device.videos.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-left hover:border-medical-500/50 hover:bg-medical-500/5 transition-all group">
          <Cpu size={24} className="text-medical-400 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold">Register Device</h4>
          <p className="text-xs text-gray-500 mt-1">Generate a new Device ID for flashing</p>
        </button>
        <button className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-left hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group">
          <Users size={24} className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold">Add User</h4>
          <p className="text-xs text-gray-500 mt-1">Invite a doctor or staff member</p>
        </button>
        <button className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-left hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
          <Activity size={24} className="text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold">System Health</h4>
          <p className="text-xs text-gray-500 mt-1">View server metrics and logs</p>
        </button>
      </div>
    </div>
  )
}
