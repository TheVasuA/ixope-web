import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, Plus, Wifi, WifiOff, Copy, Check, RefreshCw, Trash2, KeyRound, X } from 'lucide-react'
import { listDevices, registerDevice, deleteDevice, resetDeviceCredentials } from '../../services/adminApi'
import toast from 'react-hot-toast'

export default function AdminDevices() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newDeviceId, setNewDeviceId] = useState('')
  const [newDeviceName, setNewDeviceName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  // Credentials shown once after register / reset
  const [credentials, setCredentials] = useState(null)

  const fetchDevices = () => {
    setLoading(true)
    listDevices()
      .then((data) => { setDevices(Array.isArray(data) ? data : []); setLoading(false) })
      .catch((err) => {
        setLoading(false)
        if (err.status === 401 || err.status === 403) {
          toast.error('Session expired — please log in again')
          navigate('/admin/login')
        } else {
          toast.error('Failed to load devices')
        }
      })
  }

  useEffect(() => { fetchDevices() }, [])

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const resetForm = () => {
    setNewDeviceId('')
    setNewDeviceName('')
    setNewUsername('')
    setNewPassword('')
  }

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      const creds = await registerDevice({
        device_id: newDeviceId.trim() || undefined,
        name: newDeviceName.trim() || undefined,
        username: newUsername.trim() || undefined,
        password: newPassword.trim() || undefined,
      })
      toast.success(`Device ${creds.device_id} registered`)
      setShowCreate(false)
      resetForm()
      setCredentials(creds)
      fetchDevices()
    } catch (err) {
      toast.error(err.message || 'Failed to register device')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async (deviceId, e) => {
    e.stopPropagation()
    if (!confirm(`Reset login credentials for device ${deviceId}? The old password stops working.`)) return
    try {
      const creds = await resetDeviceCredentials(deviceId)
      setCredentials(creds)
      toast.success('Credentials reset')
      fetchDevices()
    } catch (err) {
      toast.error(err.message || 'Failed to reset credentials')
    }
  }

  const handleDelete = async (deviceId, e) => {
    e.stopPropagation()
    if (!confirm(`Delete device ${deviceId}? This permanently deletes the device AND all of its images and videos.`)) return
    try {
      const res = await deleteDevice(deviceId)
      toast.success(`Deleted device — ${res.deleted_images || 0} images, ${res.deleted_videos || 0} videos removed`)
      fetchDevices()
    } catch (err) {
      toast.error(err.message || 'Failed to delete device')
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
            <h3 className="text-lg font-bold mb-1">Register New Device</h3>
            <p className="text-xs text-gray-500 mb-4">Leave fields blank to auto-generate. Credentials are shown once after creation.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Device ID</label>
                <input
                  type="text"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  placeholder="Auto (e.g. 1002)"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Device Name</label>
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Auto (e.g. IXOPE-1002)"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Auto (e.g. device_1002)"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Auto (secure random)"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowCreate(false); resetForm() }} className="flex-1 py-2.5 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="flex-1 py-2.5 bg-medical-500 rounded-lg text-sm font-medium hover:bg-medical-600 disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials shown once */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCredentials(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <button onClick={() => setCredentials(null)} className="absolute right-4 top-4 text-gray-500 hover:text-white"><X size={18} /></button>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={18} className="text-medical-400" />
              <h3 className="text-lg font-bold">Device Login Credentials</h3>
            </div>
            <p className="text-xs text-amber-400 mb-4">Copy these now — the password will not be shown again.</p>
            <div className="space-y-3">
              {[
                ['Device ID', credentials.device_id],
                ['Username', credentials.username],
                ['Password', credentials.password],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className="font-mono text-sm text-white truncate">{value}</p>
                  </div>
                  <button onClick={() => handleCopy(value)} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white flex-shrink-0">
                    {copiedId === value ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setCredentials(null)} className="w-full mt-5 py-2.5 bg-medical-500 rounded-lg text-sm font-medium hover:bg-medical-600">Done</button>
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
            <div
              key={device.device_id || device.id}
              onClick={() => navigate(`/admin/devices/${device.device_id}`)}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-medical-500/40 hover:shadow-lg hover:shadow-medical-500/5 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${device.is_online ? 'bg-green-500/10' : 'bg-gray-800'}`}>
                    <Cpu size={20} className={device.is_online ? 'text-green-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{device.name || `IXOPE-${device.device_id}`}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {device.is_online ? (
                        <span className="flex items-center gap-1 text-xs text-green-400"><Wifi size={10} /> Online</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500"><WifiOff size={10} /> Offline</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => handleReset(device.device_id, e)}
                    title="Reset credentials"
                    className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-medical-400"
                  >
                    <KeyRound size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(device.device_id, e)}
                    title="Delete device and all its media"
                    className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Device ID</span>
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(device.device_id) }} className="flex items-center gap-1 font-mono text-medical-400 hover:text-medical-300">
                    {device.device_id}
                    {copiedId === device.device_id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Username</span>
                  <span className="font-mono text-gray-300">{device.username || '—'}</span>
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
