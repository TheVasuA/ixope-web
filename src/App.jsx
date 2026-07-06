import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AppLayout from './components/layout/AppLayout'
import AdminLayout from './components/admin/AdminLayout'
import GoogleSignInModal from './components/ui/GoogleSignInModal'
import { Toaster } from 'react-hot-toast'

// ─── MAINTENANCE MODE ────────────────────────────────────────────────────────
// Set to true to redirect all users to maintenance page
const MAINTENANCE_MODE = false
// ─────────────────────────────────────────────────────────────────────────────

// Retry wrapper for lazy imports — handles chunk load failures after deploy
function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch(() => {
      // Chunk failed to load (likely outdated after deploy) — reload once
      const hasReloaded = sessionStorage.getItem('chunk_reload')
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1')
        window.location.reload()
        return { default: () => null }
      }
      sessionStorage.removeItem('chunk_reload')
      // If reload didn't help, show error
      return { default: () => <ChunkError /> }
    })
  )
}

// Lazy-loaded pages
const Dashboard = lazyRetry(() => import('./pages/Dashboard'))
const ScopeGallery = lazyRetry(() => import('./pages/ScopeGallery'))
const LiveFeed = lazyRetry(() => import('./pages/LiveFeed'))
const Uploads = lazyRetry(() => import('./pages/Uploads'))
const Reports = lazyRetry(() => import('./pages/Reports'))
const Trash = lazyRetry(() => import('./pages/Trash'))
const DeviceManagement = lazyRetry(() => import('./pages/DeviceManagement'))
const ImageExamination = lazyRetry(() => import('./pages/ImageExamination'))

// Admin pages
const AdminLogin = lazyRetry(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazyRetry(() => import('./pages/admin/AdminDashboard'))
const AdminDevices = lazyRetry(() => import('./pages/admin/AdminDevices'))
const AdminDeviceGallery = lazyRetry(() => import('./pages/admin/AdminDeviceGallery'))
const AdminUsers = lazyRetry(() => import('./pages/admin/AdminUsers'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ChunkError() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Update Available</h2>
      <p className="text-gray-500 mt-2">A new version is available. Please refresh.</p>
      <button onClick={() => { sessionStorage.removeItem('chunk_reload'); window.location.reload() }} className="mt-4 btn-primary">
        Refresh Page
      </button>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">404</h2>
      <p className="text-gray-500 mt-2">Page not found</p>
      <a href="/" className="mt-4 btn-primary">Back to Dashboard</a>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Maintenance mode: only redirect the home page `/`, allow all other routes
  if (MAINTENANCE_MODE && window.location.pathname === '/') {
    window.location.href = '/maintenance.html'
    return null
  }

  // Show login modal if not authenticated (on all routes including /dashboard)
  // Login appears on top of maintenance-accessible pages

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm',
          style: { background: '#1a1a2e', color: '#f3f5fb', border: '1px solid #242438' },
        }}
      />

      <Routes>
        {/* ─── Admin Routes ───────────────────────────────────── */}
        <Route path="/admin/login" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />

        {isAuthenticated && user?.role === 'admin' && (
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
            <Route path="devices" element={<Suspense fallback={<PageLoader />}><AdminDevices /></Suspense>} />
            <Route path="devices/:deviceId" element={<Suspense fallback={<PageLoader />}><AdminDeviceGallery /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
          </Route>
        )}

        {/* ─── Portal Routes (Doctor/Staff UI) ────────────────── */}
        <Route element={<AppLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="/scope/:scope" element={<Suspense fallback={<PageLoader />}><ScopeGallery /></Suspense>} />
          <Route path="/live" element={<Suspense fallback={<PageLoader />}><LiveFeed /></Suspense>} />
          <Route path="/uploads" element={<Suspense fallback={<PageLoader />}><Uploads /></Suspense>} />
          <Route path="/reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
          <Route path="/trash" element={<Suspense fallback={<PageLoader />}><Trash /></Suspense>} />
          <Route path="/examination" element={<Suspense fallback={<PageLoader />}><ImageExamination /></Suspense>} />
          <Route path="/device" element={<Suspense fallback={<PageLoader />}><DeviceManagement /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* Auth gate — show Google Sign-In modal if not logged in (portal routes only) */}
      {!isAuthenticated && !window.location.pathname.startsWith('/admin') && <GoogleSignInModal />}
    </>
  )
}
