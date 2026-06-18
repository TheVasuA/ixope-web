import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setUser } from '../../store/slices/authSlice'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
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
        // Store token and user info
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Dim background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-surface-card rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-medical-500 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">iXope</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">IXOPE Medical Portal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to continue</p>
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
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:border-medical-500"
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
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:border-medical-500"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400">IXOPE Medical Technology</p>
        </div>
      </div>
    </div>
  )
}
