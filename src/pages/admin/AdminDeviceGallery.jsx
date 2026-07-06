import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Image, Video, Cpu } from 'lucide-react'
import { SERVER_URL } from '../../config/device'

const SCOPES = ['opth', 'oto', 'derm', 'micro']
const SCOPE_LABELS = { opth: 'Ophthalmoscope', oto: 'Otoscope', derm: 'Dermatoscope', micro: 'Microscope' }

export default function AdminDeviceGallery() {
  const { deviceId } = useParams()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('images')
  const [scopeFilter, setScopeFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch(`${SERVER_URL}/captures/images?device_id=${deviceId}`).then(r => r.json()).catch(() => []),
      fetch(`${SERVER_URL}/captures/videos?device_id=${deviceId}`).then(r => r.json()).catch(() => []),
    ]).then(([imgData, vidData]) => {
      setImages(Array.isArray(imgData) ? imgData : (imgData?.images || []))
      setVideos(Array.isArray(vidData) ? vidData : (vidData?.videos || []))
      setLoading(false)
    })
  }, [deviceId])

  const filteredImages = scopeFilter === 'all' ? images : images.filter(img => img.scope === scopeFilter)
  const filteredVideos = scopeFilter === 'all' ? videos : videos.filter(vid => vid.scope === scopeFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/devices')}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-medical-500/10">
            <Cpu size={20} className="text-medical-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">IXOPE-{deviceId}</h1>
            <p className="text-sm text-gray-400">Device Gallery — {images.length} images, {videos.length} videos</p>
          </div>
        </div>
      </div>

      {/* Tabs + Scope Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setTab('images')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'images' ? 'bg-medical-500/10 text-medical-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Image size={16} /> Images ({filteredImages.length})
          </button>
          <button
            onClick={() => setTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'videos' ? 'bg-medical-500/10 text-medical-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video size={16} /> Videos ({filteredVideos.length})
          </button>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              scopeFilter === 'all' ? 'bg-medical-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {SCOPES.map((scope) => (
            <button
              key={scope}
              onClick={() => setScopeFilter(scope)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                scopeFilter === scope ? 'bg-medical-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {SCOPE_LABELS[scope]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'images' ? (
        filteredImages.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No images found for this device</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredImages.map((img) => {
              let rawUrl = (img.url || '').replace(/^\/api/, '')
              if (!rawUrl.startsWith('/captures')) rawUrl = `/captures${rawUrl}`
              const imgSrc = `${SERVER_URL}${rawUrl}`
              return (
                <div key={img.id || img.filename} className="relative group rounded-xl overflow-hidden bg-gray-800 aspect-square ring-1 ring-gray-700 hover:ring-medical-500/40 transition-all">
                  <img
                    src={imgSrc}
                    alt={img.original_filename || img.filename}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{img.original_filename || img.filename}</p>
                    <span className="text-medical-300 text-xs uppercase font-medium">{img.scope}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        filteredVideos.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No videos found for this device</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((vid) => {
              let rawUrl = (vid.url || '').replace(/^\/api/, '')
              if (!rawUrl.startsWith('/captures')) rawUrl = `/captures${rawUrl}`
              const vidSrc = `${SERVER_URL}${rawUrl}`
              return (
                <div key={vid.id || vid.filename} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-medical-500/40 transition-all">
                  <video
                    src={vidSrc}
                    controls
                    preload="metadata"
                    className="w-full aspect-video bg-black"
                  />
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{vid.original_filename || vid.filename}</p>
                    <span className="text-xs text-medical-400 uppercase">{vid.scope}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
