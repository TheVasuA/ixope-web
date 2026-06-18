// IXOPE Device Configuration
export const DEVICE_ID = '1001'

// ─── FastAPI Server (main backend) ───────────────────────────────────────────
// For production: 'https://api.ixope-hub.com'
// For local dev: '' (empty — uses Vite proxy)
export const SERVER_URL = import.meta.env.PROD ? 'https://api.ixope-hub.com' : ''
export const API_BASE_URL = SERVER_URL

// Standard upload endpoints
export const UPLOAD_IMAGE_URL = `${API_BASE_URL}/captures/images`
export const UPLOAD_VIDEO_URL = `${API_BASE_URL}/captures/videos`

// ─── Device Flask Server (on-device, for live feed only) ─────────────────────
// In production: 'http://<device-ip>:5000'
export const DEVICE_URL = ''

// ─── Polling ─────────────────────────────────────────────────────────────────
export const POLLING_INTERVAL = 30000

export const SCOPES = ['opth', 'oto', 'derm', 'micro']

export const SCOPE_LABELS = {
  opth: 'Ophthalmoscope',
  oto: 'Otoscope',
  derm: 'Dermatoscope',
  micro: 'Microscope',
}

export const SCOPE_ICONS = {
  opth: 'Eye',
  oto: 'Ear',
  derm: 'Scan',
  micro: 'Microscope',
}

export const SCOPE_COLORS = {
  opth: { bg: 'bg-blue-50 dark:bg-blue-950/40', accent: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800' },
  oto: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', accent: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  derm: { bg: 'bg-amber-50 dark:bg-amber-950/40', accent: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-800' },
  micro: { bg: 'bg-purple-50 dark:bg-purple-950/40', accent: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800' },
}

