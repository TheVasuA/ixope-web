import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useGetScopeImagesQuery, useGetScopeVideosQuery } from '../services/api'
import { SCOPE_LABELS, SCOPE_COLORS, SCOPES } from '../config/device'
import { Eye, Ear, Scan, Microscope, Image, Video } from 'lucide-react'
import ImageGrid from '../components/ui/ImageGrid'
import VideoPlayer from '../components/ui/VideoPlayer'
import Lightbox from '../components/ui/Lightbox'
import SkeletonGrid from '../components/ui/SkeletonGrid'
import { useLightbox } from '../hooks/useLightbox'

const scopeIcons = { opth: Eye, oto: Ear, derm: Scan, micro: Microscope }

export default function ScopeGallery() {
  const { scope } = useParams()
  const [activeTab, setActiveTab] = useState('images')

  // Redirect if invalid scope
  if (!SCOPES.includes(scope)) return <Navigate to="/" replace />

  const { data: imgData, isLoading: imgLoading } = useGetScopeImagesQuery(scope)
  const { data: vidData, isLoading: vidLoading } = useGetScopeVideosQuery(scope)

  const images = imgData?.images || []
  const videos = vidData?.videos || []
  const lightbox = useLightbox(images)

  const Icon = scopeIcons[scope]
  const colors = SCOPE_COLORS[scope]
  const label = SCOPE_LABELS[scope]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors.bg} ring-1 ${colors.ring}`}>
          <Icon size={28} className={colors.accent} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{label}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {images.length} images · {videos.length} videos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'images'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Image size={16} /> Images
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'videos'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Video size={16} /> Videos
        </button>
      </div>

      {/* Content */}
      {activeTab === 'images' ? (
        imgLoading ? (
          <SkeletonGrid count={12} />
        ) : images.length > 0 ? (
          <ImageGrid images={images} onImageClick={(idx) => lightbox.open(idx)} />
        ) : (
          <div className="text-center py-20">
            <Icon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No images captured yet</p>
          </div>
        )
      ) : (
        vidLoading ? (
          <SkeletonGrid count={4} />
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video) => (
              <VideoPlayer key={video.filename} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Video size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No videos recorded yet</p>
          </div>
        )
      )}

      {/* Lightbox */}
      {lightbox.isOpen && (
        <Lightbox
          items={images}
          currentIndex={lightbox.currentIndex}
          onClose={lightbox.close}
          onNext={lightbox.next}
          onPrev={lightbox.prev}
        />
      )}
    </div>
  )
}

