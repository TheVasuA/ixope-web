import { useState } from 'react'
import { Users, Plus, Shield, User, Trash2, Mail } from 'lucide-react'

export default function AdminUsers() {
  const [users] = useState([
    { id: 1, name: 'Dr. Rajesh Kumar', email: 'rajesh@hospital.com', role: 'doctor', lastLogin: '10 min ago', active: true },
    { id: 2, name: 'Dr. Priya Sharma', email: 'priya@hospital.com', role: 'doctor', lastLogin: '2 hours ago', active: true },
    { id: 3, name: 'Nurse Anita', email: 'anita@hospital.com', role: 'staff', lastLogin: '1 day ago', active: false },
    { id: 4, name: 'Admin', email: 'admin@ixope-hub.com', role: 'admin', lastLogin: 'Now', active: true },
  ])

  const roleColors = {
    admin: 'bg-red-500/10 text-red-400 border-red-500/20',
    doctor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    staff: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage doctors, staff, and admin access</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-medical-500 to-blue-600 rounded-xl text-sm font-medium shadow-lg shadow-medical-500/20">
          <Plus size={16} /> Invite User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Login</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
                      {user.role === 'admin' ? <Shield size={16} className="text-red-400" /> : <User size={16} className="text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs ${user.active ? 'text-green-400' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{user.lastLogin}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white">
                      <Mail size={14} />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400">
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
  )
}
