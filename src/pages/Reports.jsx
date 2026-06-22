import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useGetAllImagesQuery, useGetAllVideosQuery } from '../services/api'
import { toggleImageSelection, selectAllImages, clearSelection, setPatientInfo, setGenerating } from '../store/slices/reportSlice'
import ImageGrid from '../components/ui/ImageGrid'
import VideoPlayer from '../components/ui/VideoPlayer'
import SkeletonGrid from '../components/ui/SkeletonGrid'
import { FileText, Download, ExternalLink, CheckSquare, Square, Video, Image, Archive } from 'lucide-react'
import { generateMedicalReport } from '../services/pdfService'
import { SERVER_URL } from '../config/device'
import toast from 'react-hot-toast'
import JSZip from 'jszip'

export default function Reports() {
  const dispatch = useDispatch()
  const { selectedImages, patientInfo, generating } = useSelector((state) => state.report)
  const { data: allImages, isLoading: imgLoading } = useGetAllImagesQuery()
  const { data: allVideos, isLoading: vidLoading } = useGetAllVideosQuery()

  const images = Array.isArray(allImages) ? allImages : (allImages?.images || [])
  const videos = Array.isArray(allVideos) ? allVideos : (allVideos?.videos || [])

  const [pdfUrl, setPdfUrl] = useState(null)
  const [selectedVideoIds, setSelectedVideoIds] = useState([])
  const [zipping, setZipping] = useState(false)

  const selectedIds = selectedImages.map((i) => i.filename)
  const canGenerate = (selectedImages.length > 0 || selectedVideoIds.length > 0) && patientInfo.name.trim() && patientInfo.id.trim()

  // Image selection
  const handleSelectionChange = (ids) => {
    const selected = images.filter((img) => ids.includes(img.filename))
    dispatch(selectAllImages(selected))
  }

  const handleSelectAllImages = () => {
    if (selectedIds.length === images.length) {
      dispatch(clearSelection())
    } else {
      dispatch(selectAllImages(images))
    }
  }

  // Video selection
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

  // Generate PDF + ZIP with videos
  const handleGenerate = async () => {
    dispatch(setGenerating(true))
    setZipping(true)
    try {
      const zip = new JSZip()

      // 1. Generate PDF with selected images (if any images selected)
      if (selectedImages.length > 0) {
        const pdfBlob = await generateMedicalReport(selectedImages, patientInfo)
        zip.file('ixope-report.pdf', pdfBlob)
        const url = URL.createObjectURL(pdfBlob)
        setPdfUrl(url)
      }

      // 2. Download and add selected videos to ZIP
      if (selectedVideoIds.length > 0) {
        const videoFolder = zip.folder('videos')
        for (const videoId of selectedVideoIds) {
          const video = videos.find((v) => v.id === videoId)
          if (!video) continue
          try {
            const videoUrl = `${SERVER_URL}/captures/videos/${video.id}/file?download=1`
            const res = await fetch(videoUrl)
            if (res.ok) {
              const blob = await res.blob()
              const filename = video.original_filename || video.filename || `video_${video.id}.mp4`
              videoFolder.file(filename, blob)
            }
          } catch (err) {
            console.error(`Failed to fetch video ${videoId}:`, err)
          }
        }
      }

      // 3. Download selected images as files in ZIP
      if (selectedImages.length > 0) {
        const imageFolder = zip.folder('images')
        for (const img of selectedImages) {
          try {
            let rawUrl = (img.url || '').replace(/^\/api/, '')
            if (!rawUrl.startsWith('/captures')) rawUrl = `/captures${rawUrl}`
            const imgUrl = `${SERVER_URL}${rawUrl}`
            const res = await fetch(imgUrl)
            if (res.ok) {
              const blob = await res.blob()
              const filename = img.original_filename || img.filename
              imageFolder.file(filename, blob)
            }
          } catch (err) {
            console.error(`Failed to fetch image:`, err)
          }
        }
      }

      // 4. Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipUrl = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `ixope-report-${patientInfo.id || 'patient'}.zip`
      a.click()
      URL.revokeObjectURL(zipUrl)

      toast.success('Report ZIP downloaded successfully')
    } catch (err) {
      toast.error('Failed to generate report')
      console.error(err)
    }
    setZipping(false)
    dispatch(setGenerating(false))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select images & videos, generate PDF report and download as ZIP</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info Form */}
        <div className="medical-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText size={18} className="text-medical-500" /> Patient Info
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Name *</label>
              <input
                type="text"
                value={patientInfo.name}
                onChange={(e) => dispatch(setPatientInfo({ name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="Patient name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">ID *</label>
              <input
                type="text"
                value={patientInfo.id}
                onChange={(e) => dispatch(setPatientInfo({ id: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="Patient ID"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
              <input
                type="date"
                value={patientInfo.dateOfBirth}
                onChange={(e) => dispatch(setPatientInfo({ dateOfBirth: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</label>
              <textarea
                value={patientInfo.notes}
                onChange={(e) => dispatch(setPatientInfo({ notes: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 resize-none"
                rows={3}
                placeholder="Clinical notes..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Selection summary */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {selectedImages.length > 0 && (
                <p className="flex items-center gap-1.5">
                  <Image size={12} /> {selectedImages.length} images selected
                </p>
              )}
              {selectedVideoIds.length > 0 && (
                <p className="flex items-center gap-1.5">
                  <Video size={12} /> {selectedVideoIds.length} videos selected
                </p>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating || zipping}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {(generating || zipping) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {zipping ? 'Creating ZIP...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Archive size={16} />
                  Download Report ZIP
                </>
              )}
            </button>

            {pdfUrl && (
              <div className="flex gap-2">
                <a href={pdfUrl} download="ixope-report.pdf" className="flex-1 btn-secondary text-sm text-center flex items-center justify-center gap-1.5">
                  <Download size={14} /> PDF Only
                </a>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn-secondary text-sm text-center flex items-center justify-center gap-1.5">
                  <ExternalLink size={14} /> Open PDF
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Image & Video Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* ─── Image Gallery ─────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Image size={18} className="text-medical-500" />
                Images ({selectedIds.length}/{images.length})
              </h2>
              <button onClick={handleSelectAllImages} className="btn-secondary text-sm flex items-center gap-1.5">
                {selectedIds.length === images.length ? <CheckSquare size={14} /> : <Square size={14} />}
                {selectedIds.length === images.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {imgLoading ? (
              <SkeletonGrid count={12} />
            ) : images.length > 0 ? (
              <ImageGrid
                images={images}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
              />
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Image size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No images available</p>
              </div>
            )}
          </div>

          {/* ─── Video Gallery ─────────────────────────────────────────── */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Video size={18} className="text-emerald-500" />
                Videos ({selectedVideoIds.length}/{videos.length})
              </h2>
              {videos.length > 0 && (
                <button onClick={handleSelectAllVideos} className="btn-secondary text-sm flex items-center gap-1.5">
                  {selectedVideoIds.length === videos.length ? <CheckSquare size={14} /> : <Square size={14} />}
                  {selectedVideoIds.length === videos.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {vidLoading ? (
              <SkeletonGrid count={4} />
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="relative">
                    {/* Selection overlay */}
                    <div
                      onClick={() => toggleVideoSelect(video.id)}
                      className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                        selectedVideoIds.includes(video.id)
                          ? 'bg-medical-500 shadow-md'
                          : 'bg-black/40 backdrop-blur-sm border border-white/40 hover:border-white/70'
                      }`}
                    >
                      {selectedVideoIds.includes(video.id) && (
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className={`rounded-xl transition-all ${selectedVideoIds.includes(video.id) ? 'ring-2 ring-medical-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}>
                      <VideoPlayer video={video} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Video size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No videos available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
