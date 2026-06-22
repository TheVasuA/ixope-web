import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useGetAllImagesQuery, useGetAllVideosQuery } from '../services/api'
import { selectAllImages, clearSelection, setPatientInfo, setGenerating } from '../store/slices/reportSlice'
import { SERVER_URL } from '../config/device'
import {
  FileText, Download, CheckSquare, Square, Video, Image, Archive,
  ChevronLeft, ChevronRight, X, ExternalLink
} from 'lucide-react'
import { generateMedicalReport } from '../services/pdfService'
import toast from 'react-hot-toast'
import JSZip from 'jszip'

const IMG_PAGE_SIZE = 12
const VID_PAGE_SIZE = 6

export default function Reports() {
  const dispatch = useDispatch()
  const { selectedImages, patientInfo, generating } = useSelector((state) => state.report)
  const { data: allImages, isLoading: imgLoading } = useGetAllImagesQuery()
  const { data: allVideos, isLoading: vidLoading } = useGetAllVideosQuery()

  const images = Array.isArray(allImages) ? allImages : (allImages?.images || [])
  const videos = Array.isArray(allVideos) ? allVideos : (allVideos?.videos || [])

  const [imgPage, setImgPage] = useState(0)
  const [vidPage, setVidPage] = useState(0)
  const [selectedVideoIds, setSelectedVideoIds] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)

  const imgTotalPages = Math.ceil(images.length / IMG_PAGE_SIZE)
  const vidTotalPages = Math.ceil(videos.length / VID_PAGE_SIZE)
  const pagedImages = images.slice(imgPage * IMG_PAGE_SIZE, (imgPage + 1) * IMG_PAGE_SIZE)
  const pagedVideos = videos.slice(vidPage * VID_PAGE_SIZE, (vidPage + 1) * VID_PAGE_SIZE)

  const selectedIds = selectedImages.map((i) => i.filename)
  const totalSelected = selectedImages.length + selectedVideoIds.length

  // ─── Selection Handlers ──────────────────────────────────────────────

  const toggleImageSelect = (img) => {
    const isSelected = selectedIds.includes(img.filename)
    if (isSelected) {
      dispatch(selectAllImages(selectedImages.filter((i) => i.filename !== img.filename)))
    } else {
      dispatch(selectAllImages([...selectedImages, img]))
    }
  }

  const handleSelectAllImages = () => {
    selectedIds.length === images.length ? dispatch(clearSelection()) : dispatch(selectAllImages(images))
  }

  const toggleVideoSelect = (videoId) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    )
  }

  const handleSelectAllVideos = () => {
    selectedVideoIds.length === videos.length ? setSelectedVideoIds([]) : setSelectedVideoIds(videos.map((v) => v.id))
  }

  // ─── Generate ────────────────────────────────────────────────────────

  const canGenerate = totalSelected > 0 && patientInfo.name.trim() && patientInfo.id.trim()

  const handleGenerate = async () => {
    dispatch(setGenerating(true))
    setZipping(true)
    try {
      const zip = new JSZip()

      if (selectedImages.length > 0) {
        const pdfBlob = await generateMedicalReport(selectedImages, patientInfo)
        zip.file('ixope-report.pdf', pdfBlob)
        setPdfUrl(URL.createObjectURL(pdfBlob))

        const imageFolder = zip.folder('images')
        for (const img of selectedImages) {
          try {
            let rawUrl = (img.url || '').replace(/^\/api/, '')
            if (!rawUrl.startsWith('/captures')) rawUrl = `/captures${rawUrl}`
            const res = await fetch(`${SERVER_URL}${rawUrl}`)
            if (res.ok) imageFolder.file(img.original_filename || img.filename, await res.blob())
          } catch (err) { console.error(err) }
        }
      }

      if (selectedVideoIds.length > 0) {
        const videoFolder = zip.folder('videos')
        for (const videoId of selectedVideoIds) {
          const video = videos.find((v) => v.id === videoId)
          if (!video) continue
          try {
            const res = await fetch(`${SERVER_URL}/captures/videos/${video.id}/file?download=1`)
            if (res.ok) videoFolder.file(video.original_filename || video.filename || `video_${video.id}.mp4`, await res.blob())
          } catch (err) { console.error(err) }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(zipBlob)
      a.download = `ixope-report-${patientInfo.id || 'patient'}.zip`
      a.click()
      toast.success('Report ZIP downloaded')
      setShowModal(false)
    } catch (err) {
      toast.error('Failed to generate report')
      console.error(err)
    }
    setZipping(false)
    dispatch(setGenerating(false))
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select images & videos to generate report</p>
        </div>
        {totalSelected > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-medical-500 hover:bg-medical-600 text-white font-medium rounded-xl shadow-lg shadow-medical-500/20 transition-all"
          >
            <Archive size={18} />
            Generate Report ({totalSelected})
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
                {selectedImages.length}/{images.length}
              </span>
            </h2>
            <button onClick={handleSelectAllImages} className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
              {selectedIds.length === images.length ? <CheckSquare size={12} /> : <Square size={12} />}
              {selectedIds.length === images.length ? 'Deselect' : 'All'}
            </button>
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
                {pagedImages.map((img) => (
                  <div
                    key={img.id || img.filename}
                    onClick={() => toggleImageSelect(img)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-150 ${
                      selectedIds.includes(img.filename)
                        ? 'border-medical-500 ring-2 ring-medical-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <img src={getImgUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded flex items-center justify-center text-white ${
                      selectedIds.includes(img.filename) ? 'bg-medical-500' : 'bg-black/30 border border-white/40'
                    }`}>
                      {selectedIds.includes(img.filename) && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase bg-black/50 text-white/80">{img.scope}</span>
                  </div>
                ))}
              </div>
              {imgTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => setImgPage((p) => Math.max(0, p - 1))} disabled={imgPage === 0} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <span className="text-[11px] text-gray-500">{imgPage + 1}/{imgTotalPages}</span>
                  <button onClick={() => setImgPage((p) => Math.min(imgTotalPages - 1, p + 1))} disabled={imgPage === imgTotalPages - 1} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronRight size={16} /></button>
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
                    onClick={() => toggleVideoSelect(video.id)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-150 ${
                      selectedVideoIds.includes(video.id)
                        ? 'border-medical-500 ring-2 ring-medical-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="aspect-video bg-black relative">
                      <video src={`${SERVER_URL}/captures/videos/${video.id}/file`} className="w-full h-full object-cover" preload="metadata" muted />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded flex items-center justify-center text-white ${
                      selectedVideoIds.includes(video.id) ? 'bg-medical-500' : 'bg-black/30 border border-white/40'
                    }`}>
                      {selectedVideoIds.includes(video.id) && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                    <div className="px-2 py-1.5 bg-white dark:bg-gray-800">
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">{video.original_filename || video.filename}</p>
                      <p className="text-[9px] text-gray-400 uppercase">{video.scope}</p>
                    </div>
                  </div>
                ))}
              </div>
              {vidTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => setVidPage((p) => Math.max(0, p - 1))} disabled={vidPage === 0} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <span className="text-[11px] text-gray-500">{vidPage + 1}/{vidTotalPages}</span>
                  <button onClick={() => setVidPage((p) => Math.min(vidTotalPages - 1, p + 1))} disabled={vidPage === vidTotalPages - 1} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* ─── Floating Generate Button ──────────────────────────────────── */}
      {totalSelected > 0 && !showModal && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-medical-500 hover:bg-medical-600 text-white font-semibold rounded-full shadow-2xl shadow-medical-500/30 transition-all hover:scale-105"
          >
            <Archive size={20} />
            Generate Report ({totalSelected})
          </button>
        </div>
      )}

      {/* ─── Patient Info Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Generate Report</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedImages.length > 0 && `${selectedImages.length} images`}
                  {selectedImages.length > 0 && selectedVideoIds.length > 0 && ' · '}
                  {selectedVideoIds.length > 0 && `${selectedVideoIds.length} videos`}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Patient Name *</label>
                <input
                  type="text"
                  value={patientInfo.name}
                  onChange={(e) => dispatch(setPatientInfo({ name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-medical-500 outline-none"
                  placeholder="Patient name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Patient ID *</label>
                <input
                  type="text"
                  value={patientInfo.id}
                  onChange={(e) => dispatch(setPatientInfo({ id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-medical-500 outline-none"
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
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Clinical Notes</label>
                <textarea
                  value={patientInfo.notes}
                  onChange={(e) => dispatch(setPatientInfo({ notes: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 resize-none focus:ring-2 focus:ring-medical-500 outline-none"
                  rows={3}
                  placeholder="Clinical notes..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || generating || zipping}
                className="flex items-center gap-2 px-5 py-2.5 bg-medical-500 hover:bg-medical-600 text-white font-medium text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                {(generating || zipping) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {zipping ? 'Creating ZIP...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download ZIP
                  </>
                )}
              </button>
            </div>

            {pdfUrl && (
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <a href={pdfUrl} download="ixope-report.pdf" className="flex-1 btn-secondary text-xs text-center flex items-center justify-center gap-1.5">
                  <Download size={12} /> PDF Only
                </a>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn-secondary text-xs text-center flex items-center justify-center gap-1.5">
                  <ExternalLink size={12} /> Open PDF
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
