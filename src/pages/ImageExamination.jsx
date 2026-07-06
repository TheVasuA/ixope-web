import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useGetAllImagesQuery, useUploadSnapshotMutation, useUpdateImageNotesMutation } from '../services/api'
import { selectAllImages } from '../store/slices/reportSlice'
import { SERVER_URL } from '../config/device'
import {
  Eye, Ear, Scan, ZoomIn, ZoomOut, Camera, FileText, Download,
  X, Check, RotateCcw, Maximize2, Grid3X3, CheckCircle2, Upload
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Configuration ───────────────────────────────────────────────────────────

const SAMPLE_TYPES = [
  { id: 'opth', label: 'Eye', icon: Eye, color: 'blue' },
  { id: 'oto', label: 'Ear', icon: Ear, color: 'emerald' },
  { id: 'derm', label: 'Skin', icon: Scan, color: 'amber' },
]

const SKIN_BODY_PARTS = [
  { id: 'arm', label: 'Arm', icon: '💪' },
  { id: 'chest', label: 'Chest', icon: '🫁' },
  { id: 'ears', label: 'Ears', icon: '👂' },
  { id: 'hand', label: 'Hand', icon: '✋' },
  { id: 'head', label: 'Head', icon: '🧠' },
  { id: 'foot', label: 'Foot', icon: '🦶' },
  { id: 'leg', label: 'Leg', icon: '🦵' },
]

const COLOR_MAP = {
  blue: {
    active: 'bg-blue-500 text-white shadow-blue-500/30 shadow-lg',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    ring: 'ring-blue-500',
  },
  emerald: {
    active: 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg',
    hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    ring: 'ring-emerald-500',
  },
  amber: {
    active: 'bg-amber-500 text-white shadow-amber-500/30 shadow-lg',
    hover: 'hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    ring: 'ring-amber-500',
  },
}

// Physical field-of-view for a zoomed-in dermatoscope capture.
const DERM_FOV_MM = 45

/**
 * Draw a 45 mm × 45 mm X–Y axis ruler along the bottom (X) and left (Y) margins
 * of a square canvas. Origin is bottom-left. Used only for zoomed-in skin images
 * so lesion dimensions can be measured against a known scale.
 */
function draw45mmScale(ctx, size) {
  const pxPerMm = size / DERM_FOV_MM
  const color = 'rgba(255, 235, 59, 0.95)' // yellow, high-contrast
  const fontPx = Math.max(10, Math.round(size * 0.022))
  const majorTick = size * 0.035
  const minorTick = size * 0.018

  ctx.save()
  ctx.lineWidth = Math.max(1, size * 0.002)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.font = `${fontPx}px sans-serif`
  ctx.textBaseline = 'alphabetic'
  // Dark outline for readability over bright/light images
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
  ctx.shadowBlur = Math.max(1, size * 0.003)

  const inset = ctx.lineWidth

  // Axis baselines
  ctx.beginPath()
  ctx.moveTo(0, size - inset)
  ctx.lineTo(size, size - inset) // X axis (bottom)
  ctx.moveTo(inset, 0)
  ctx.lineTo(inset, size) // Y axis (left)
  ctx.stroke()

  for (let mm = 0; mm <= DERM_FOV_MM; mm++) {
    const isMajor = mm % 5 === 0
    const len = isMajor ? majorTick : minorTick
    const x = mm * pxPerMm
    const y = size - mm * pxPerMm // origin at bottom

    // X-axis tick (bottom)
    ctx.beginPath()
    ctx.moveTo(x, size - inset)
    ctx.lineTo(x, size - inset - len)
    ctx.stroke()

    // Y-axis tick (left)
    ctx.beginPath()
    ctx.moveTo(inset, y)
    ctx.lineTo(inset + len, y)
    ctx.stroke()

    if (isMajor && mm > 0) {
      ctx.textAlign = 'center'
      ctx.fillText(`${mm}`, x, size - inset - majorTick - 3)
      ctx.textAlign = 'left'
      ctx.fillText(`${mm}`, inset + majorTick + 3, y + fontPx * 0.35)
    }
  }

  // Unit label
  ctx.textAlign = 'right'
  ctx.fillText('mm', size - 6, size - inset - majorTick - 3)
  ctx.restore()
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ImageExamination() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // State
  const [sampleType, setSampleType] = useState('derm')
  const [bodyPart, setBodyPart] = useState('arm')
  const [viewingImage, setViewingImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [snapshots, setSnapshots] = useState([])
  const [selectedForPdf, setSelectedForPdf] = useState([])
  const [capturing, setCapturing] = useState(false)
  const [snapshotNotes, setSnapshotNotes] = useState({}) // { snapId: 'note text' }
  const [imgError, setImgError] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)

  const imageRef = useRef(null)
  const viewportRef = useRef(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  // API
  const { data: allImages } = useGetAllImagesQuery()
  const [uploadSnapshot] = useUploadSnapshotMutation()
  const [updateImageNotes] = useUpdateImageNotesMutation()

  const images = useMemo(() => {
    if (!allImages) return []
    const list = Array.isArray(allImages) ? allImages : (allImages.images || [])
    if (!sampleType) return list
    return list.filter((img) => img.scope === sampleType)
  }, [allImages, sampleType])

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleSampleTypeChange = (type) => {
    setSampleType(type)
    setBodyPart(null)
    setViewingImage(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleBodyPartSelect = (part) => {
    setBodyPart(part)
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 5))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  const handleImageSelect = (img) => {
    setViewingImage(img)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setImgError(false)
    setImgLoading(true)
  }

  // Pan handlers
  const handleMouseDown = (e) => {
    if (zoom <= 1) return
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
  }

  const handleMouseUp = (e) => {
    isDragging.current = false
    e.currentTarget.style.cursor = zoom > 1 ? 'grab' : 'default'
  }

  // Attach a non-passive wheel listener so preventDefault() actually stops the
  // page from scrolling. React's synthetic onWheel is registered as passive,
  // which silently ignores preventDefault(). Zoom is Skin-only.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e) => {
      if (sampleType !== 'derm') return // zoom only for Skin
      e.preventDefault()
      setZoom((z) => {
        const next = e.deltaY < 0 ? z + 0.25 : z - 0.25
        return Math.min(5, Math.max(0.5, next))
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [sampleType])

  // Snap current zoomed view and upload to server
  const handleSnapshot = useCallback(async () => {
    if (!viewingImage || !imageRef.current) return

    setCapturing(true)
    try {
      // Fetch the image as a blob to avoid cross-origin canvas taint
      const imgUrl = getImgUrl(viewingImage)
      const response = await fetch(imgUrl)
      const imgBlob = await response.blob()
      const imageBitmap = await createImageBitmap(imgBlob)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const container = imageRef.current.parentElement
      const containerRect = container.getBoundingClientRect()
      const imgEl = imageRef.current
      const imgRect = imgEl.getBoundingClientRect()

      // Capture a centered SQUARE region of the viewport (not the full wide box)
      const side = Math.min(containerRect.width, containerRect.height)
      const regionLeft = containerRect.left + (containerRect.width - side) / 2
      const regionTop = containerRect.top + (containerRect.height - side) / 2

      // Square output canvas at 2x for quality
      canvas.width = side * 2
      canvas.height = side * 2

      // Calculate visible portion using bitmap natural dimensions
      const scaleX = imageBitmap.width / imgRect.width
      const scaleY = imageBitmap.height / imgRect.height

      const sx = (regionLeft - imgRect.left) * scaleX
      const sy = (regionTop - imgRect.top) * scaleY
      const sw = side * scaleX
      const sh = side * scaleY

      ctx.drawImage(
        imageBitmap,
        Math.max(0, sx), Math.max(0, sy),
        Math.min(sw, imageBitmap.width - Math.max(0, sx)),
        Math.min(sh, imageBitmap.height - Math.max(0, sy)),
        0, 0, canvas.width, canvas.height
      )
      imageBitmap.close()

      // 45 mm × 45 mm X–Y axis scale — only for zoomed-in Skin images
      const isZoomedSkin = sampleType === 'derm' && zoom > 1
      if (isZoomedSkin) {
        draw45mmScale(ctx, canvas.width)
      }

      // Convert canvas to blob for upload
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `SNAP_${(sampleType || 'exam').toUpperCase()}_${timestamp}.jpg`
      const file = new File([blob], fileName, { type: 'image/jpeg' })

      // Upload to server
      const scope = sampleType || 'derm'
      const result = await uploadSnapshot({
        file,
        scope,
        bodyPart: bodyPart || '',
        notes: isZoomedSkin
          ? `Snapshot at ${Math.round(zoom * 100)}% zoom · 45mm×45mm scale`
          : `Snapshot at ${Math.round(zoom * 100)}% zoom`,
      }).unwrap()

      // Store locally for PDF selection
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      const snapshot = {
        id: result.id,
        dataUrl,
        filename: result.filename,
        source: viewingImage.filename,
        scope,
        bodyPart,
        zoom: `${Math.round(zoom * 100)}%`,
        timestamp: new Date().toLocaleTimeString(),
        uploaded: true,
      }

      setSnapshots((prev) => [...prev, snapshot])

      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Snapshot saved</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Uploaded to {scope === 'derm' ? 'Dermatoscope' : scope === 'oto' ? 'Otoscope' : 'Ophthalmoscope'} gallery
              </p>
            </div>
          </div>
        ),
        { duration: 3000 }
      )
    } catch (err) {
      console.error('Snapshot failed:', err)
      toast.error('Failed to save snapshot')
    }
    setCapturing(false)
  }, [viewingImage, zoom, sampleType, bodyPart, uploadSnapshot])

  // PDF selection
  const togglePdfSelect = (snapId) => {
    setSelectedForPdf((prev) =>
      prev.includes(snapId) ? prev.filter((id) => id !== snapId) : [...prev, snapId]
    )
  }

  const selectAllForPdf = () => {
    if (selectedForPdf.length === snapshots.length) {
      setSelectedForPdf([])
    } else {
      setSelectedForPdf(snapshots.map((s) => s.id))
    }
  }

  const removeSnapshot = (snapId) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== snapId))
    setSelectedForPdf((prev) => prev.filter((id) => id !== snapId))
    setSnapshotNotes((prev) => { const n = { ...prev }; delete n[snapId]; return n })
  }

  const updateSnapshotNote = (snapId, text) => {
    setSnapshotNotes((prev) => ({ ...prev, [snapId]: text }))
  }

  // Save notes to server on blur (debounced save)
  const saveNotesToServer = async (snapId) => {
    const notes = snapshotNotes[snapId]
    if (notes === undefined) return
    try {
      await updateImageNotes({ imageId: snapId, notes }).unwrap()
      toast.success('Notes saved', { duration: 1500, style: { fontSize: '12px' } })
    } catch (err) {
      console.error('Failed to save notes:', err)
      toast.error('Failed to save notes')
    }
  }

  // Image URL helper — use same-origin proxy path when available
  const getImgUrl = (img) => {
    let rawUrl = (img.url || '').replace(/^\/api/, '')
    if (!rawUrl.startsWith('/captures')) rawUrl = `/captures${rawUrl}`
    // In production, try same-origin first (via Cloudflare proxy or nginx)
    // Fall back to full API URL if needed
    return `${SERVER_URL}${rawUrl}`
  }

  // ─── Render ──────────────────────────────────────────────────────────

  const activeColor = SAMPLE_TYPES.find((t) => t.id === sampleType)?.color || 'blue'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Image Examination</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select sample type, zoom and capture snapshots for reports
        </p>
      </div>

      {/* ─── Sample Type + Body Region (one row, separate sections) ─────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Sample Type */}
        <section className="medical-card flex-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Sample Type
          </h2>
          <div className="flex flex-wrap gap-3">
            {SAMPLE_TYPES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => handleSampleTypeChange(id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-200 ${
                  sampleType === id
                    ? `${COLOR_MAP[color].active} border-transparent`
                    : `border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 ${COLOR_MAP[color].hover}`
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Body Region — only for Skin */}
        {sampleType === 'derm' && (
          <section className="medical-card flex-1">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Body Region
            </h2>
            <div className="flex flex-wrap gap-2">
              {SKIN_BODY_PARTS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => handleBodyPartSelect(id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
                    bodyPart === id
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            {bodyPart && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">Selected:</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${COLOR_MAP.amber.badge}`}>
                  {SKIN_BODY_PARTS.find((p) => p.id === bodyPart)?.icon}{' '}
                  {SKIN_BODY_PARTS.find((p) => p.id === bodyPart)?.label}
                  <button onClick={() => setBodyPart(null)} className="ml-1 hover:text-amber-900 dark:hover:text-amber-100">
                    <X size={12} />
                  </button>
                </span>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ─── Image Viewer + Zoom ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Image list (left panel) */}
        <div className="xl:col-span-1 medical-card max-h-[600px] overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Grid3X3 size={14} />
            Images {sampleType && <span className={`text-xs px-2 py-0.5 rounded-full ${COLOR_MAP[activeColor].badge}`}>{images.length}</span>}
          </h2>

          {!sampleType ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              Select a sample type to view images
            </p>
          ) : images.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              No images found for this type
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                <button
                  key={img.id || img.filename}
                  onClick={() => handleImageSelect(img)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                    viewingImage?.filename === img.filename
                      ? `${COLOR_MAP[activeColor].ring} ring-2 border-transparent`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={getImgUrl(img)}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom viewer (main area) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="medical-card p-0 overflow-hidden">
            {/* Zoom toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {/* Zoom controls — Skin only */}
              {sampleType === 'derm' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    disabled={!viewingImage}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <div className="px-3 py-1 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-mono font-medium text-gray-700 dark:text-gray-200 min-w-[4rem] text-center">
                    {Math.round(zoom * 100)}%
                  </div>
                  <button
                    onClick={handleZoomIn}
                    disabled={!viewingImage}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    disabled={!viewingImage}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-colors"
                    title="Reset zoom"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              ) : (
                <div />
              )}

              {/* Snapshot button */}
              <button
                onClick={handleSnapshot}
                disabled={!viewingImage || capturing}
                className="flex items-center gap-2 px-4 py-2 bg-medical-500 hover:bg-medical-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors shadow-sm"
              >
                {capturing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                {capturing ? 'Saving...' : 'Capture & Save'}
              </button>
            </div>

            {/* Image viewport */}
            <div
              ref={viewportRef}
              className="relative w-full h-[450px] bg-gray-900 overflow-hidden select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
            >
              {viewingImage ? (
                <>
                  {imgLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {imgError ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <X size={32} className="mb-2" />
                      <p className="text-sm">Failed to load image</p>
                      <p className="text-xs text-gray-500 mt-1">{viewingImage.filename}</p>
                    </div>
                  ) : (
                    <img
                      ref={imageRef}
                      src={getImgUrl(viewingImage)}
                      alt={viewingImage.filename}
                      className="absolute top-1/2 left-1/2 max-w-full max-h-full object-contain transition-transform duration-100"
                      style={{
                        transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                      }}
                      draggable={false}
                      onLoad={() => setImgLoading(false)}
                      onError={() => { setImgLoading(false); setImgError(true) }}
                    />
                  )}
                  {/* Square capture guide — shows the region that will be saved */}
                  {!imgError && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                      <div className="relative h-full aspect-square ring-1 ring-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
                          Capture area
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Maximize2 size={48} className="mb-3 text-gray-600" />
                  <p className="text-sm">Select an image to examine</p>
                  <p className="text-xs text-gray-600 mt-1">Use scroll wheel to zoom, drag to pan</p>
                </div>
              )}
            </div>

            {/* Image info bar */}
            {viewingImage && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">{viewingImage.original_filename || viewingImage.filename}</span>
                <span>•</span>
                <span className="uppercase text-medical-500 font-medium">{viewingImage.scope}</span>
                {bodyPart && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full ${COLOR_MAP.amber.badge} text-xs`}>
                      {SKIN_BODY_PARTS.find((p) => p.id === bodyPart)?.label}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Captured Snapshots with Notes ─────────────────────────────── */}
      {snapshots.length > 0 && (
        <section className="medical-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Camera size={14} />
              Captured Snapshots
              <span className="text-xs px-2 py-0.5 rounded-full bg-medical-100 dark:bg-medical-900/30 text-medical-600 dark:text-medical-300">
                {snapshots.length}
              </span>
            </h2>

            <div className="flex items-center gap-3">
              <button
                onClick={selectAllForPdf}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {selectedForPdf.length === snapshots.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={() => {
                  // Carry snapshot selection to Reports page via Redux
                  const snapsToSelect = snapshots.map((snap) => ({
                    id: snap.id,
                    filename: snap.filename,
                    original_filename: snap.filename,
                    scope: snap.scope,
                    url: `/captures/images/${snap.id}/file`,
                  }))
                  dispatch(selectAllImages(snapsToSelect))
                  navigate('/reports')
                }}
                className="flex items-center gap-2 px-4 py-2 bg-medical-500 hover:bg-medical-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <FileText size={16} />
                Generate PDF ({snapshots.length})
              </button>
            </div>
          </div>

          {/* Snapshot cards with notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  selectedForPdf.includes(snap.id)
                    ? 'border-medical-500 ring-2 ring-medical-500/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Image + selection click area */}
                <div
                  className="relative cursor-pointer group"
                  onClick={() => togglePdfSelect(snap.id)}
                >
                  {/* Selection checkbox */}
                  <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                    selectedForPdf.includes(snap.id)
                      ? 'bg-medical-500 shadow-md'
                      : 'bg-black/40 backdrop-blur-sm border border-white/30'
                  }`}>
                    {selectedForPdf.includes(snap.id) && <Check size={12} className="text-white" />}
                  </div>

                  {/* Upload badge */}
                  {snap.uploaded && (
                    <div className="absolute top-2 right-10 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-medium">
                      <CheckCircle2 size={10} />
                      Saved
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSnapshot(snap.id) }}
                    className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={12} />
                  </button>

                  {/* Snapshot image */}
                  <div className="aspect-video">
                    <img
                      src={snap.dataUrl}
                      alt={`Snapshot ${snap.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/80 font-medium">{snap.zoom}</span>
                      <span className="text-[11px] text-white/50">{snap.timestamp}</span>
                    </div>
                    {snap.bodyPart && (
                      <span className="text-[11px] text-amber-300 font-medium">
                        {SKIN_BODY_PARTS.find((p) => p.id === snap.bodyPart)?.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                  <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    Notes
                  </label>
                  <textarea
                    value={snapshotNotes[snap.id] || ''}
                    onChange={(e) => updateSnapshotNote(snap.id, e.target.value)}
                    onBlur={() => saveNotesToServer(snap.id)}
                    placeholder="Add clinical notes for this image..."
                    rows={2}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500 outline-none transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <Upload size={12} />
            All snapshots are saved to the server. Notes will appear as descriptions below each image in the PDF report.
          </p>
        </section>
      )}
    </div>
  )
}
