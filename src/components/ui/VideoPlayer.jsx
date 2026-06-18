import { useState, useRef } from 'react'
import ReactPlayer from 'react-player'
import { Trash2, Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react'
import { useDeleteVideoMutation } from '../../services/api'
import { SERVER_URL } from '../../config/device'
import { formatFileSize, formatDate } from '../../utils/formatters'

export default function VideoPlayer({ video, onDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const playerRef = useRef(null)
  const [deleteVideo, { isLoading }] = useDeleteVideoMutation()

  const videoUrl = `${SERVER_URL}${video.url}`
  const thumbUrl = video.thumbnail_url ? `${SERVER_URL}${video.thumbnail_url}` : null

  const handleDelete = async () => {
    try {
      await deleteVideo(video.id).unwrap()
      onDeleted?.(video.id)
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setShowConfirm(false)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    playerRef.current?.seekTo(fraction)
  }

  return (
    <div className="medical-card overflow-hidden group">
      {/* Player container */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={playing}
          muted={muted}
          width="100%"
          height="100%"
          onProgress={({ played }) => setProgress(played)}
          onDuration={(d) => setDuration(d)}
          light={thumbUrl || true}
          playIcon={
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Play size={28} className="text-white ml-1" fill="white" />
            </div>
          }
          onClickPreview={() => setPlaying(true)}
          config={{
            file: {
              attributes: { controlsList: 'nodownload' },
            },
          }}
        />

        {/* Custom controls overlay */}
        {playing && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress bar */}
            <div className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-2" onClick={handleSeek}>
              <div className="h-full bg-medical-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setPlaying(!playing)} className="p-1 text-white hover:text-medical-400">
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button onClick={() => setMuted(!muted)} className="p-1 text-white hover:text-medical-400">
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <span className="text-xs text-white/70 ml-2">
                  {formatTime(progress * duration)} / {formatTime(duration)}
                </span>
              </div>
              <button
                onClick={() => playerRef.current?.getInternalPlayer()?.requestFullscreen?.()}
                className="p-1 text-white hover:text-medical-400"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{video.original_filename || video.filename}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatFileSize(video.file_size || video.size)} · {formatDate(video.captured_at || video.created)} · <span className="uppercase text-medical-500 font-medium">{video.scope}</span>
          </p>
        </div>
        <div className="flex-shrink-0 ml-3">
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
