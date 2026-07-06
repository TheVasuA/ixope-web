import { useState } from 'react'
import { Trash2, Download } from 'lucide-react'
import { useDeleteVideoMutation } from '../../services/api'
import { SERVER_URL } from '../../config/device'
import { formatFileSize, formatDate } from '../../utils/formatters'

export default function VideoPlayer({ video, onDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteVideo, { isLoading }] = useDeleteVideoMutation()

  // Use the API file endpoint which returns proper Content-Type and Accept-Ranges headers
  const videoPlayUrl = `${SERVER_URL}/captures/videos/${video.id}/file`

  const handleDelete = async () => {
    try {
      await deleteVideo(video.id).unwrap()
      onDeleted?.(video.id)
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setShowConfirm(false)
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(videoPlayUrl)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = video.original_filename || video.filename || 'video.mp4'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <div className="medical-card overflow-hidden">
      {/* Native browser video player */}
      <div className="rounded-lg overflow-hidden bg-black aspect-video">
        <video
          className="w-full h-full object-contain"
          controls
          playsInline
          preload="auto"
        >
          <source src={videoPlayUrl} type="video/mp4" />
        </video>
      </div>

      {/* Video info */}
      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{video.original_filename || video.filename}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatFileSize(video.file_size || video.size)} · {formatDate(video.captured_at || video.created)} · <span className="uppercase text-medical-500 font-medium">{video.scope}</span>
          </p>
        </div>
        <div className="flex-shrink-0 ml-3 flex items-center gap-1">
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-medical-500 transition-colors"
            title="Download video"
          >
            <Download size={16} />
          </button>

          {showConfirm ? (
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={isLoading} className="text-xs px-2.5 py-1.5 bg-red-500 text-white rounded-lg font-medium">
                {isLoading ? '...' : 'Delete'}
              </button>
              <button onClick={() => setShowConfirm(false)} className="text-xs px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowConfirm(true)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
