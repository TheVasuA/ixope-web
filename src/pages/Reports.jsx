import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useGetAllImagesQuery } from '../services/api'
import { toggleImageSelection, selectAllImages, clearSelection, setPatientInfo, setGenerating } from '../store/slices/reportSlice'
import ImageGrid from '../components/ui/ImageGrid'
import SkeletonGrid from '../components/ui/SkeletonGrid'
import { FileText, Download, ExternalLink, CheckSquare, Square } from 'lucide-react'
import { generateMedicalReport } from '../services/pdfService'
import toast from 'react-hot-toast'

export default function Reports() {
  const dispatch = useDispatch()
  const { selectedImages, patientInfo, generating } = useSelector((state) => state.report)
  const { data: allImages, isLoading } = useGetAllImagesQuery()
  const images = allImages || []

  const [pdfUrl, setPdfUrl] = useState(null)

  const selectedIds = selectedImages.map((i) => i.filename)
  const canGenerate = selectedImages.length > 0 && patientInfo.name.trim() && patientInfo.id.trim()

  const handleSelectionChange = (ids) => {
    const selected = images.filter((img) => ids.includes(img.filename))
    dispatch(selectAllImages(selected))
  }

  const handleSelectAll = () => {
    if (selectedIds.length === images.length) {
      dispatch(clearSelection())
    } else {
      dispatch(selectAllImages(images))
    }
  }

  const handleGenerate = async () => {
    dispatch(setGenerating(true))
    try {
      const blob = await generateMedicalReport(selectedImages, patientInfo)
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      toast.success('Report generated successfully')
    } catch (err) {
      toast.error('Failed to generate report')
      console.error(err)
    }
    dispatch(setGenerating(false))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select images and generate PDF reports</p>
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
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? 'Generating...' : `Generate Report (${selectedImages.length} images)`}
            </button>

            {pdfUrl && (
              <div className="flex gap-2">
                <a href={pdfUrl} download="ixope-report.pdf" className="flex-1 btn-secondary text-sm text-center flex items-center justify-center gap-1.5">
                  <Download size={14} /> Download
                </a>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn-secondary text-sm text-center flex items-center justify-center gap-1.5">
                  <ExternalLink size={14} /> Open
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Image Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Select Images ({selectedIds.length}/{images.length})</h2>
            <button onClick={handleSelectAll} className="btn-secondary text-sm flex items-center gap-1.5">
              {selectedIds.length === images.length ? <CheckSquare size={14} /> : <Square size={14} />}
              {selectedIds.length === images.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {isLoading ? (
            <SkeletonGrid count={12} />
          ) : (
            <ImageGrid
              images={images}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

