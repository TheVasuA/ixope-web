import { useState, useRef, useCallback, useMemo } from 'react'
import { useGetAllImagesQuery, useUploadSnapshotMutation } from '../services/api'
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImageExamination() {
  // State
  const [sampleType, setSampleType] = useState(null)
  const [bodyPart, setBodyPart] = useState(null)
  const [viewingImage, setViewingImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [snapshots, setSnapshots] = useState([])
  const [selectedForPdf, setSelectedForPdf] = useState([])
  const [capturing, setCapturing] = useState(false)

  const imageRef = useRef(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  // API
  const { data: allImages } = useGetAllImagesQuery()
  const [uploadSnapshot] = useUploadSnapshotMutation()

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

  const handleWheel = (e) => {
    e.preventDefault()
    if (e.deltaY < 0) handleZoomIn()
    else handleZoomOut()
  }

  // Snap current zoomed view and upload to server
  const handleSnapshot = useCallback(async () => {
    if (!viewingImage || !imageRef.current) return

    setCapturing(true)
    try {
      // Load image via fetch to avoid CORS taint on canvas
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

      // Canvas = viewport size
      canvas.width = containerRect.width
      canvas.height = containerRect.height

      // Calculate the visible portion based on current zoom & pan
      const sx = (containerRect.left - imgRect.left) * (imageBitmap.width / imgRect.width)
      const sy = (containerRect.top - imgRect.top) * (imageBitmap.height / imgRect.height)
      const sw = containerRect.width * (imageBitmap.width / imgRect.width)
      const sh = containerRect.height * (imageBitmap.height / imgRect.height)

      ctx.drawImage(
        imageBitmap,
        Math.max(0, sx), Math.max(0, sy), Math.min(sw, imageBitmap.width), Math.min(sh, imageBitmap.height),
        0, 0, canvas.width, canvas.height
      )

      // Convert canvas to blob for upload
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `SNAP_${(sampleType || 'exam').toUpperCase()}_${timestamp}.jpg`
      const file = new File([blob], fileName, { type: 'image/jpeg' })

      // Upload to server — saves in the scope's gallery (e.g. derm)
      const scope = sampleType || 'derm'
      const result = await uploadSnapshot({
        file,
        scope,
        bodyPart: bodyPart || '',
        notes: `Snapshot at ${Math.round(zoom * 100)}% zoom`,
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
  }

  // Image URL helper
  const getImgUrl = (img) => {
    let rawUrl = (img.url || '').replace(/^\/api/, '')
    if (!rawUrl.startsWith('/captures')) rawUrl = `/captures${rawUrl}`
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

      {/* ─── Sample Type Selection ──────────────────────────────────────── */}
      <section className="medical-card">
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

        {/* Body Part selector for Skin */}
        {sampleType === 'derm' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Body Region
            </h3>
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
              <div className="mt-2 flex items-center gap-2">
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
          </div>
        )}
      </section>

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
              className="relative w-full h-[450px] bg-gray-900 overflow-hidden select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
            >
              {viewingImage ? (
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
                />
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

      {/* ─── Captured Snapshots ────────────────────────────────────────── */}
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

              <a
                href="/reports"
                className="flex items-center gap-2 px-4 py-2 bg-medical-500 hover:bg-medical-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <FileText size={16} />
                Go to Reports to generate PDF
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="relative group rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
              >
                {/* Upload success badge */}
                {snap.uploaded && (
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-medium">
                    <CheckCircle2 size={10} />
                    Saved
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeSnapshot(snap.id)}
                  className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={12} />
                </button>

                {/* Snapshot image */}
                <div className="aspect-square">
                  <img
                    src={snap.dataUrl}
                    alt={`Snapshot ${snap.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/70 font-medium">{snap.zoom}</span>
                    <span className="text-[10px] text-white/50">{snap.timestamp}</span>
                  </div>
                  {snap.bodyPart && (
                    <span className="text-[10px] text-amber-300 font-medium">
                      {SKIN_BODY_PARTS.find((p) => p.id === snap.bodyPart)?.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <Upload size={12} />
            All snapshots are automatically saved to the server gallery. Use the Reports page to select and generate PDF.
          </p>
        </section>
      )}
    </div>
  )
}
