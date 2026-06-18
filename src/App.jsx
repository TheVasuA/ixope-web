import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AppLayout from './components/layout/AppLayout'
import AdminLayout from './components/admin/AdminLayout'
import GoogleSignInModal from './components/ui/GoogleSignInModal'
import { Toaster } from 'react-hot-toast'

// ─── MAINTENANCE MODE ────────────────────────────────────────────────────────
// Set to true to redirect all users to maintenance page
const MAINTENANCE_MODE = true
// ─────────────────────────────────────────────────────────────────────────────

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ScopeGallery = lazy(() => import('./pages/ScopeGallery'))
const LiveFeed = lazy(() => import('./pages/LiveFeed'))
const Uploads = lazy(() => import('./pages/Uploads'))
const Reports = lazy(() => import('./pages/Reports'))
const DeviceManagement = lazy(() => import('./pages/DeviceManagement'))

// Admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminDevices = lazy(() => import('./pages/admin/AdminDevices'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin" />
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
          <Route path="/device" element={<Suspense fallback={<PageLoader />}><DeviceManagement /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* Auth gate — show Google Sign-In modal if not logged in (portal routes only) */}
      {!isAuthenticated && <GoogleSignInModal />}
    </>
  )
}
