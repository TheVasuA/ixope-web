import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useGetScopeImagesQuery, useGetScopeVideosQuery } from '../services/api'
import { SCOPE_LABELS, SCOPE_COLORS, SCOPES } from '../config/device'
import { Eye, Ear, Scan, Microscope, Image, Video, ChevronLeft, ChevronRight } from 'lucide-react'
import ImageGrid from '../components/ui/ImageGrid'
import VideoPlayer from '../components/ui/VideoPlayer'
import Lightbox from '../components/ui/Lightbox'
import SkeletonGrid from '../components/ui/SkeletonGrid'
import { useLightbox } from '../hooks/useLightbox'

const scopeIcons = { opth: Eye, oto: Ear, derm: Scan, micro: Microscope }
const IMG_PAGE_SIZE = 16
const VID_PAGE_SIZE = 6

export default function ScopeGallery() {
  const { scope } = useParams()
  const [imgPage, setImgPage] = useState(0)
  const [vidPage, setVidPage] = useState(0)

  if (!SCOPES.includes(scope)) return <Navigate to="/" replace />

  const { data: imgData, isLoading: imgLoading } = useGetScopeImagesQuery(scope)
  const { data: vidData, isLoading: vidLoading } = useGetScopeVideosQuery(scope)

  const images = Array.isArray(imgData) ? imgData : (imgData?.images || [])
  const videos = Array.isArray(vidData) ? vidData : (vidData?.videos || [])
  const lightbox = useLightbox(images)

  const imgTotalPages = Math.ceil(images.length / IMG_PAGE_SIZE)
  const vidTotalPages = Math.ceil(videos.length / VID_PAGE_SIZE)
  const pagedImages = images.slice(imgPage * IMG_PAGE_SIZE, (imgPage + 1) * IMG_PAGE_SIZE)
  const pagedVideos = videos.slice(vidPage * VID_PAGE_SIZE, (vidPage + 1) * VID_PAGE_SIZE)

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

      {/* Two column layout: Images | Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Images Column ─────────────────────────────────────────── */}
        <section className="medical-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Image size={16} className="text-medical-500" />
              Images
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-medical-100 dark:bg-medical-900/30 text-medical-600 dark:text-medical-300">
                {images.length}
              </span>
            </h2>
          </div>

          {imgLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <Icon size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">No images captured yet</p>
            </div>
          ) : (
            <>
              <ImageGrid images={pagedImages} onImageClick={(idx) => lightbox.open(imgPage * IMG_PAGE_SIZE + idx)} />

              {imgTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => setImgPage((p) => Math.max(0, p - 1))} disabled={imgPage === 0} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronLeft size={18} /></button>
                  <span className="text-sm font-semibold text-medical-600 dark:text-medical-400 bg-medical-50 dark:bg-medical-900/30 px-3 py-1 rounded-lg">{imgPage + 1} / {imgTotalPages}</span>
                  <button onClick={() => setImgPage((p) => Math.min(imgTotalPages - 1, p + 1))} disabled={imgPage === imgTotalPages - 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronRight size={18} /></button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Videos Column ─────────────────────────────────────────── */}
        <section className="medical-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Video size={16} className="text-emerald-500" />
              Videos
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300">
                {videos.length}
              </span>
            </h2>
          </div>

          {vidLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <Video size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">No videos recorded yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {pagedVideos.map((video) => (
                  <VideoPlayer key={video.filename} video={video} />
                ))}
              </div>

              {vidTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => setVidPage((p) => Math.max(0, p - 1))} disabled={vidPage === 0} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronLeft size={18} /></button>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg">{vidPage + 1} / {vidTotalPages}</span>
                  <button onClick={() => setVidPage((p) => Math.min(vidTotalPages - 1, p + 1))} disabled={vidPage === vidTotalPages - 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronRight size={18} /></button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

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
