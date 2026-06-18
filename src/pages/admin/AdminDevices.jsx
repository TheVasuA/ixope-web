import { useState } from 'react'
import { Cpu, Plus, Wifi, WifiOff, Copy, Check, Trash2, RefreshCw } from 'lucide-react'

export default function AdminDevices() {
  const [devices, setDevices] = useState([
    { id: '1001', name: 'IXOPE-1001', online: true, ip: '192.168.1.101', createdAt: '2025-01-15', lastSeen: '2 min ago' },
    { id: '1002', name: 'IXOPE-1002', online: true, ip: '192.168.1.102', createdAt: '2025-03-20', lastSeen: '1 min ago' },
    { id: '1003', name: 'IXOPE-1003', online: false, ip: '192.168.1.103', createdAt: '2025-05-10', lastSeen: '3 hours ago' },
  ])
  const [showCreate, setShowCreate] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const generateDeviceId = () => {
    const maxId = Math.max(...devices.map(d => parseInt(d.id)), 1000)
    return String(maxId + 1)
  }

  const handleCreate = () => {
    const newId = generateDeviceId()
    setDevices([...devices, {
      id: newId,
      name: newDeviceName || `IXOPE-${newId}`,
      online: false,
      ip: '—',
      createdAt: new Date().toISOString().split('T')[0],
      lastSeen: 'Never',
    }])
    setNewDeviceName('')
    setShowCreate(false)
  }

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = (id) => {
    if (confirm(`Delete device ${id}? This cannot be undone.`)) {
      setDevices(devices.filter(d => d.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Device Management</h1>
          <p className="text-sm text-gray-400 mt-1">Register, monitor, and manage IXOPE devices</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-medical-500 to-blue-600 rounded-xl text-sm font-medium shadow-lg shadow-medical-500/20 hover:shadow-medical-500/30 transition-all"
        >
          <Plus size={16} /> Register Device
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Register New Device</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Device Name (optional)</label>
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder={`IXOPE-${generateDeviceId()}`}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none"
                />
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Generated Device ID</p>
                <p className="text-2xl font-mono font-bold text-medical-400">{generateDeviceId()}</p>
                <p className="text-xs text-gray-500 mt-2">Flash this ID to the device before deployment</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
                  Cancel
                </button>
                <button onClick={handleCreate} className="flex-1 py-2.5 bg-medical-500 rounded-lg text-sm font-medium hover:bg-medical-600">
                  Create Device
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div key={device.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${device.online ? 'bg-green-500/10' : 'bg-gray-800'}`}>
                  <Cpu size={20} className={device.online ? 'text-green-400' : 'text-gray-500'} />
                </div>
                <div>
                  <h3 className="font-semibold">{device.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {device.online ? (
                      <span className="flex items-center gap-1 text-xs text-green-400"><Wifi size={10} /> Online</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-500"><WifiOff size={10} /> Offline</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(device.id)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Device ID</span>
                <button onClick={() => handleCopy(device.id)} className="flex items-center gap-1 font-mono text-medical-400 hover:text-medical-300">
                  {device.id}
                  {copiedId === device.id ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IP Address</span>
                <span className="font-mono text-gray-300">{device.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Seen</span>
                <span className="text-gray-300">{device.lastSeen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Registered</span>
                <span className="text-gray-300">{device.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
