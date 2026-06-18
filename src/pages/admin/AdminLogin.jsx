import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../../store/slices/authSlice'
import { Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react'

const ADMIN_EMAIL = 'admin@ixope-hub.com'
const ADMIN_PASS = 'ixope@321'

export default function AdminLogin() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        dispatch(setUser({
          name: 'Admin',
          email: ADMIN_EMAIL,
          picture: '',
          role: 'admin',
          googleId: 'admin-001',
        }))
        navigate('/admin')
      } else {
        setError('Invalid email or password')
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-surface-dark to-gray-900 p-4">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-medical-500/20 via-purple-500/20 to-medical-500/20 rounded-3xl blur-xl" />

        <div className="relative bg-surface-card/95 backdrop-blur-xl border border-surface-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-medical-500 via-blue-400 to-medical-600" />

          <div className="p-8">
            {/* Logo + Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-medical-500 to-blue-600 flex items-center justify-center shadow-lg shadow-medical-500/25 mb-4">
                <Shield size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Console</h1>
              <p className="text-sm text-gray-400 mt-1">IXOPE Device Management System</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ixope-hub.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-medical-500 to-blue-600 hover:from-medical-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-medical-500/25 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={16} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-900/30 border-t border-surface-border text-center">
            <p className="text-xs text-gray-500">IXOPE Medical Technology · Secure Admin Access</p>
          </div>
        </div>
      </div>
    </div>
  )
}
