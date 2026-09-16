import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Users, Plus, Shield, User, Trash2, X } from 'lucide-react'
import { listUsers, createUser, deleteUser } from '../../services/adminApi'
import toast from 'react-hot-toast'

const roleColors = {
  admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  doctor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  staff: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const currentUser = useSelector((s) => s.auth.user)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', username: '', password: '', role: 'doctor' })

  const fetchUsers = () => {
    setLoading(true)
    listUsers()
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch((err) => {
        setLoading(false)
        if (err.status === 401 || err.status === 403) {
          toast.error('Session expired — please log in again')
          navigate('/admin/login')
        } else {
          toast.error('Failed to load users')
        }
      })
  }

  useEffect(() => { fetchUsers() }, [])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.email.trim() || !form.username.trim() || !form.password.trim()) {
      toast.error('Email, username, and password are required')
      return
    }
    setSubmitting(true)
    try {
      await createUser({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        role: form.role,
      })
      toast.success('User created')
      setShowCreate(false)
      setForm({ full_name: '', email: '', username: '', password: '', role: 'doctor' })
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user) => {
    if (!confirm(`Delete user "${user.username}"? This removes their account permanently.`)) return
    try {
      await deleteUser(user.id)
      toast.success('User deleted')
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Failed to delete user')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage doctors, staff, and admin access</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-medical-500 to-blue-600 rounded-xl text-sm font-medium shadow-lg shadow-medical-500/20 self-start sm:self-auto"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <button onClick={() => setShowCreate(false)} className="absolute right-4 top-4 text-gray-500 hover:text-white"><X size={18} /></button>
            <h3 className="text-lg font-bold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Full Name</label>
                <input type="text" value={form.full_name} onChange={(e) => setField('full_name', e.target.value)} placeholder="Dr. Jane Doe"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="jane@hospital.com"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Username</label>
                <input type="text" value={form.username} onChange={(e) => setField('username', e.target.value)} placeholder="jdoe"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Password</label>
                <input type="text" value={form.password} onChange={(e) => setField('password', e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Role</label>
                <select value={form.role} onChange={(e) => setField('role', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-medical-500 focus:outline-none">
                  <option value="doctor">Doctor</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="flex-1 py-2.5 bg-medical-500 rounded-lg text-sm font-medium hover:bg-medical-600 disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
                <th className="px-4 md:px-6 py-3">User</th>
                <th className="px-4 md:px-6 py-3">Role</th>
                <th className="px-4 md:px-6 py-3">Status</th>
                <th className="px-4 md:px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading users…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No users yet</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                        {user.role === 'admin' ? <Shield size={16} className="text-red-400" /> : <User size={16} className="text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.full_name || user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role] || roleColors.staff}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs ${user.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={currentUser?.id === user.id}
                        title={currentUser?.id === user.id ? 'You cannot delete your own account' : 'Delete user'}
                        className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
