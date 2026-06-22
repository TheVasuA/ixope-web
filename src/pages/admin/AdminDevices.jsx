import { useState, useEffect } from 'react'
import { Cpu, Plus, Wifi, WifiOff, Copy, Check, Trash2, RefreshCw } from 'lucide-react'
import { SERVER_URL } from '../../config/device'
import toast from 'react-hot-toast'

export default function AdminDevices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newDeviceId, setNewDeviceId] = useState('')
  const [newDeviceName, setNewDeviceName] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const fetchDevices = () => {
    fetch(`${SERVER_URL}/devices`)
      .then(r => r.json())
      .then(data => { setDevices(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchDevices() }, [])

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreate = async () => {
    const deviceId = newDeviceId || String(Math.max(...devices.map(d => parseInt(d.device_id) || 1000), 1000) + 1)
    try {
      // Register device by sending a heartbeat
      await fetch(`${SERVER_URL}/devices/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, ip_address: '' }),
      })
      toast.success(`Device ${deviceId} registered`)
      setShowCreate(false)
      setNewDeviceId('')
      setNewDeviceName('')
      fetchDevices()
    } catch (err) {
      toast.error('Failed to register device')
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Device Management</h1>
          <p className="text-sm text-gray-400 mt-1">Register, monitor, and manage IXOPE devices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDevices} className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-medical-500 to-blue-600 rounded-xl text-sm font-medium shadow-lg shadow-medical-500/20"
          >
            <Plus size={16} /> Register Device
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Register New Device</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Device ID</label>
                <input
                  type="text"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  placeholder="e.g. 1002"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
                <button onClick={handleCreate} className="flex-1 py-2.5 bg-medical-500 rounded-lg text-sm font-medium hover:bg-medical-600">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Devices Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading devices...</div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No devices registered yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div key={device.device_id || device.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${device.is_online ? 'bg-green-500/10' : 'bg-gray-800'}`}>
                    <Cpu size={20} className={device.is_online ? 'text-green-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <h3 className="font-semibold">IXOPE-{device.device_id}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {device.is_online ? (
                        <span className="flex items-center gap-1 text-xs text-green-400"><Wifi size={10} /> Online</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500"><WifiOff size={10} /> Offline</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Device ID</span>
                  <button onClick={() => handleCopy(device.device_id)} className="flex items-center gap-1 font-mono text-medical-400 hover:text-medical-300">
                    {device.device_id}
                    {copiedId === device.device_id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IP Address</span>
                  <span className="font-mono text-gray-300">{device.ip_address || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Seen</span>
                  <span className="text-gray-300">{timeAgo(device.last_seen)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
