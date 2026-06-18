import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { SERVER_URL } from '../../config/device'
import { formatDate } from '../../utils/formatters'

export default function Lightbox({ items, currentIndex, onClose, onNext, onPrev }) {
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)

  if (!items.length) return null
  const current = items[currentIndex]

  // Use full-resolution URL (not thumbnail)
  const fullUrl = `${SERVER_URL}${current.url}`

  const handleZoomIn = (e) => { e.stopPropagation(); setZoom((z) => Math.min(z + 0.5, 4)) }
  const handleZoomOut = (e) => { e.stopPropagation(); setZoom((z) => Math.max(z - 0.5, 0.5)) }
  const handleDownload = (e) => {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = fullUrl
    a.download = current.original_filename || current.filename
    a.click()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      {/* Top toolbar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="text-white/70 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
          {currentIndex + 1} / {items.length}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={handleZoomOut} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <ZoomOut size={18} />
          </button>
          <span className="text-xs text-white/50 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <ZoomIn size={18} />
          </button>
          <button onClick={handleDownload} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-2">
            <Download size={18} />
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-2">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); setZoom(1); setLoading(true); onPrev() }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
      >
        <ChevronLeft size={28} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setZoom(1); setLoading(true); onNext() }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
      >
        <ChevronRight size={28} />
      </button>

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Full-resolution image */}
      <img
        src={fullUrl}
        alt={current.original_filename || current.filename}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg transition-transform duration-200 select-none"
        style={{ transform: `scale(${zoom})` }}
        onClick={(e) => e.stopPropagation()}
        onLoad={() => setLoading(false)}
        draggable={false}
      />

      {/* Bottom caption */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="text-center">
          <p className="text-sm font-medium text-white">{current.original_filename || current.filename}</p>
          <p className="text-xs text-white/50 mt-1">
            <span className="uppercase text-medical-400 font-medium">{current.scope}</span>
            {current.captured_at && ` · ${formatDate(current.captured_at)}`}
          </p>
        </div>
      </div>
    </div>
  )
}
