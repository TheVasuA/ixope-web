import { useState, useRef, useCallback } from 'react'
import { Trash2, Play, Pause, Maximize2, Volume2, VolumeX, Download, SkipBack, SkipForward } from 'lucide-react'
import { useDeleteVideoMutation } from '../../services/api'
import { SERVER_URL } from '../../config/device'
import { formatFileSize, formatDate } from '../../utils/formatters'

export default function VideoPlayer({ video, onDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef(null)
  const hideTimeout = useRef(null)
  const [deleteVideo, { isLoading }] = useDeleteVideoMutation()

  // Ensure video URL has the correct /captures prefix
  const videoPath = (video.url || '').replace(/^\/api/, '')
  const normalizedPath = videoPath.startsWith('/captures') ? videoPath : `/captures${videoPath}`
  const videoUrl = `${SERVER_URL}${normalizedPath.replace(/\/file$/, '/stream')}`
  const rawFileUrl = `${SERVER_URL}${normalizedPath}`

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
    if (!seconds || !isFinite(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (videoRef.current) {
      videoRef.current.currentTime = fraction * duration
      setProgress(fraction)
    }
  }

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [playing])

  const skip = (seconds) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
  }

  const toggleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen()
    } else if (videoRef.current?.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen()
    }
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(rawFileUrl)
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

  const handleMouseMove = () => {
    setShowControls(true)
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    if (playing) {
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  return (
    <div className="medical-card overflow-hidden">
      {/* Player container */}
      <div
        className="relative rounded-lg overflow-hidden bg-black aspect-video cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => playing && setShowControls(false)}
        onMouseEnter={() => setShowControls(true)}
      >
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-3">
            <Play size={32} className="opacity-50" />
            <p className="text-sm">Video format not supported by browser</p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-medical-500 text-white text-sm font-medium rounded-lg hover:bg-medical-600 transition-colors flex items-center gap-2"
            >
              <Download size={14} /> Download to watch
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              muted={muted}
              playsInline
              preload="metadata"
              onTimeUpdate={() => {
                if (videoRef.current && duration > 0) {
                  setProgress(videoRef.current.currentTime / duration)
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration)
                }
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => { setPlaying(false); setShowControls(true) }}
              onEnded={() => { setPlaying(false); setProgress(0); setShowControls(true) }}
              onError={() => setError(true)}
              onClick={togglePlay}
            />

            {/* Big play button when paused */}
            {!playing && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/20"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors">
                  <Play size={28} className="text-white ml-1" fill="white" />
                </div>
              </div>
            )}

            {/* Controls overlay */}
            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {/* Progress bar */}
              <div
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/bar"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-medical-500 rounded-full relative transition-all"
                  style={{ width: `${progress * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity shadow" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Skip back */}
                  <button onClick={() => skip(-5)} className="p-1.5 text-white hover:text-medical-400 transition-colors" title="Back 5s">
                    <SkipBack size={14} />
                  </button>

                  {/* Play/Pause */}
                  <button onClick={togglePlay} className="p-1.5 text-white hover:text-medical-400 transition-colors">
                    {playing ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  {/* Skip forward */}
                  <button onClick={() => skip(5)} className="p-1.5 text-white hover:text-medical-400 transition-colors" title="Forward 5s">
                    <SkipForward size={14} />
                  </button>

                  {/* Mute */}
                  <button onClick={() => setMuted(!muted)} className="p-1.5 text-white hover:text-medical-400 transition-colors">
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  {/* Time */}
                  <span className="text-xs text-white/70 ml-2 tabular-nums">
                    {formatTime(progress * duration)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Download */}
                  <button onClick={handleDownload} className="p-1.5 text-white hover:text-medical-400 transition-colors" title="Download">
                    <Download size={16} />
                  </button>

                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="p-1.5 text-white hover:text-medical-400 transition-colors" title="Fullscreen">
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
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
        <div className="flex-shrink-0 ml-3 flex items-center gap-1">
          {/* Download button in info bar too */}
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
