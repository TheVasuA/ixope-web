import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setUser } from '../../store/slices/authSlice'
import { Lock, User, Eye, EyeOff, Shield, Camera, Wifi } from 'lucide-react'
import { SERVER_URL } from '../../config/device'

export default function GoogleSignInModal() {
  const dispatch = useDispatch()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${SERVER_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('ixope-token', data.access_token)
        dispatch(setUser({
          ...data.user,
          token: data.access_token,
        }))
      } else {
        setError(data.detail || 'Login failed')
      }
    } catch (err) {
      setError('Cannot connect to server')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col lg:flex-row bg-gradient-to-r from-teal-400 to-yellow-200">
      {/* ─── Left side: Welcome content ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-16 xl:p-24">
        <div className="max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold text-teal-800 leading-tight tracking-tight mb-8">
            Welcome to IXOPE
          </h1>

          <p className="text-base text-gray-700 leading-relaxed mb-12">
            Intelligent Digital Medical Device platform. Capture, manage, and analyze medical imaging across multiple diagnostic scopes.
          </p>

          {/* Feature highlights */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm flex-shrink-0">
                <Camera size={22} className="text-teal-700" />
              </div>
              <span className="text-sm font-medium text-gray-800 leading-snug">Multi-scope medical imaging capture</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm flex-shrink-0">
                <Shield size={22} className="text-teal-700" />
              </div>
              <span className="text-sm font-medium text-gray-800 leading-snug">Secure cloud storage & DICOM export</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm flex-shrink-0">
                <Wifi size={22} className="text-teal-700" />
              </div>
              <span className="text-sm font-medium text-gray-800 leading-snug">Real-time device connectivity</span>
            </div>
          </div>

          <p className="mt-16 text-xs text-gray-600/50">© 2026 IXOPE · Intelligent Digital Medical Device</p>
        </div>
      </div>

      {/* ─── Vertical divider (desktop only) ───────────────────────────── */}
      <div className="hidden lg:block w-px bg-gray-900/10 self-stretch my-16" />

      {/* ─── Right side: Login ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 min-h-screen lg:min-h-0">
        {/* Logo above login card */}
        <div className="mb-6">
          <img src="/logo.png" alt="IXOPE" className="h-14" />
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username or email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">IXOPE © 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
