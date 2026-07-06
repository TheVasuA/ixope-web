import { useState } from 'react'
import { useGetAllImagesQuery, useGetAllVideosQuery, useDeleteImageMutation, useDeleteVideoMutation } from '../services/api'
import { SERVER_URL } from '../config/device'
import {
  Trash2, CheckSquare, Square, Video, Image,
  ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

const IMG_PAGE_SIZE = 16
const VID_PAGE_SIZE = 6

export default function Trash() {
  const { data: allImages, isLoading: imgLoading } = useGetAllImagesQuery()
  const { data: allVideos, isLoading: vidLoading } = useGetAllVideosQuery()
  const [deleteImage] = useDeleteImageMutation()
  const [deleteVideo] = useDeleteVideoMutation()

  const images = Array.isArray(allImages) ? allImages : (allImages?.images || [])
  const videos = Array.isArray(allVideos) ? allVideos : (allVideos?.videos || [])

  const [imgPage, setImgPage] = useState(0)
  const [vidPage, setVidPage] = useState(0)
  const [selectedImageIds, setSelectedImageIds] = useState([])
  const [selectedVideoIds, setSelectedVideoIds] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const imgTotalPages = Math.ceil(images.length / IMG_PAGE_SIZE)
  const vidTotalPages = Math.ceil(videos.length / VID_PAGE_SIZE)
  const pagedImages = images.slice(imgPage * IMG_PAGE_SIZE, (imgPage + 1) * IMG_PAGE_SIZE)
  const pagedVideos = videos.slice(vidPage * VID_PAGE_SIZE, (vidPage + 1) * VID_PAGE_SIZE)

  const totalSelected = selectedImageIds.length + selectedVideoIds.length

  // ─── Selection Handlers ──────────────────────────────────────────────

  const toggleImageSelect = (img) => {
    const id = img.id || img.filename
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectAllImages = () => {
    if (selectedImageIds.length === images.length) {
      setSelectedImageIds([])
    } else {
      setSelectedImageIds(images.map((img) => img.id || img.filename))
    }
  }

  const toggleVideoSelect = (videoId) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    )
  }

  const handleSelectAllVideos = () => {
    if (selectedVideoIds.length === videos.length) {
      setSelectedVideoIds([])
    } else {
      setSelectedVideoIds(videos.map((v) => v.id))
    }
  }

  // ─── Delete Handler ──────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleting(true)
    let successCount = 0
    let failCount = 0

    for (const id of selectedImageIds) {
      try {
        await deleteImage(id).unwrap()
        successCount++
      } catch { failCount++ }
    }

    for (const id of selectedVideoIds) {
      try {
        await deleteVideo(id).unwrap()
        successCount++
      } catch { failCount++ }
    }

    if (successCount > 0) toast.success(`Deleted ${successCount} file${successCount > 1 ? 's' : ''}`)
    if (failCount > 0) toast.error(`Failed to delete ${failCount} file${failCount > 1 ? 's' : ''}`)

    setSelectedImageIds([])
    setSelectedVideoIds([])
    setShowConfirm(false)
    setDeleting(false)
  }

  const getImgUrl = (img) => {
    let rawUrl = (img.url || '').replace(/^\/api/, '')
    if (!rawUrl.startsWith('/captures')) rawUrl = `/captures${rawUrl}`
    return `${SERVER_URL}${rawUrl}`
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Files</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select images & videos to delete</p>
        </div>
        {totalSelected > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl shadow-lg shadow-red-500/20 transition-all"
          >
            <Trash2 size={18} />
            Delete ({totalSelected})
          </button>
        )}
      </div>

      {/* ─── Two Column: Images | Videos ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Images Column ─────────────────────────────────────────────── */}
        <section className="medical-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Image size={16} className="text-medical-500" />
              Images
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-medical-100 dark:bg-medical-900/30 text-medical-600 dark:text-medical-300">
                {selectedImageIds.length}/{images.length}
              </span>
            </h2>
            {images.length > 0 && (
              <button onClick={handleSelectAllImages} className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                {selectedImageIds.length === images.length ? <CheckSquare size={12} /> : <Square size={12} />}
                {selectedImageIds.length === images.length ? 'Deselect' : 'All'}
              </button>
            )}
          </div>

          {imgLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No images</p>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {pagedImages.map((img) => {
                  const id = img.id || img.filename
                  return (
                    <div
                      key={id}
                      onClick={() => toggleImageSelect(img)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-150 ${
                        selectedImageIds.includes(id)
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <img src={getImgUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded flex items-center justify-center text-white ${
                        selectedImageIds.includes(id) ? 'bg-red-500' : 'bg-black/30 border border-white/40'
                      }`}>
                        {selectedImageIds.includes(id) && (
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                      </div>
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase bg-black/50 text-white/80">{img.scope}</span>
                    </div>
                  )
                })}
              </div>
              {imgTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => setImgPage((p) => Math.max(0, p - 1))} disabled={imgPage === 0} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronLeft size={18} /></button>
                  <span className="text-sm font-semibold text-medical-600 dark:text-medical-400 bg-medical-50 dark:bg-medical-900/30 px-3 py-1 rounded-lg">{imgPage + 1} / {imgTotalPages}</span>
                  <button onClick={() => setImgPage((p) => Math.min(imgTotalPages - 1, p + 1))} disabled={imgPage === imgTotalPages - 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronRight size={18} /></button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Videos Column ─────────────────────────────────────────────── */}
        <section className="medical-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Video size={16} className="text-emerald-500" />
              Videos
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300">
                {selectedVideoIds.length}/{videos.length}
              </span>
            </h2>
            {videos.length > 0 && (
              <button onClick={handleSelectAllVideos} className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                {selectedVideoIds.length === videos.length ? <CheckSquare size={12} /> : <Square size={12} />}
                {selectedVideoIds.length === videos.length ? 'Deselect' : 'All'}
              </button>
            )}
          </div>

          {vidLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No videos</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {pagedVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                      selectedVideoIds.includes(video.id)
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="aspect-video bg-black relative">
                      <video src={`${SERVER_URL}/captures/videos/${video.id}/file`} className="w-full h-full object-cover" controls playsInline preload="metadata" muted />
                    </div>
                    <div
                      onClick={() => toggleVideoSelect(video.id)}
                      className={`absolute top-1.5 left-1.5 w-5 h-5 rounded flex items-center justify-center cursor-pointer z-10 transition-all ${
                        selectedVideoIds.includes(video.id) ? 'bg-red-500' : 'bg-black/40 backdrop-blur-sm border border-white/40 hover:border-white/70'
                      }`}
                    >
                      {selectedVideoIds.includes(video.id) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                    <div onClick={() => toggleVideoSelect(video.id)} className="px-2 py-1.5 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">{video.original_filename || video.filename}</p>
                      <p className="text-[9px] text-gray-400 uppercase">{video.scope}</p>
                    </div>
                  </div>
                ))}
              </div>
              {vidTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => setVidPage((p) => Math.max(0, p - 1))} disabled={vidPage === 0} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronLeft size={18} /></button>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg">{vidPage + 1} / {vidTotalPages}</span>
                  <button onClick={() => setVidPage((p) => Math.min(vidTotalPages - 1, p + 1))} disabled={vidPage === vidTotalPages - 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronRight size={18} /></button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* ─── Floating Delete Button ────────────────────────────────────── */}
      {totalSelected > 0 && !showConfirm && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-2xl shadow-red-500/30 transition-all hover:scale-105"
          >
            <Trash2 size={20} />
            Delete ({totalSelected})
          </button>
        </div>
      )}

      {/* ─── Confirmation Modal ────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You are about to permanently delete{' '}
              <strong>{selectedImageIds.length} image{selectedImageIds.length !== 1 ? 's' : ''}</strong>
              {selectedVideoIds.length > 0 && (
                <> and <strong>{selectedVideoIds.length} video{selectedVideoIds.length !== 1 ? 's' : ''}</strong></>
              )}.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
