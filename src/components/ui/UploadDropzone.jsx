import { useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Upload, FolderOpen } from 'lucide-react'
import { addToQueue } from '../../store/slices/uploadSlice'
import { SCOPES, SCOPE_LABELS } from '../../config/device'

const ACCEPTED_TYPES = {
  image: ['.jpg', '.jpeg', '.png', '.bmp'],
  video: ['.mp4', '.avi', '.mov', '.webm'],
}

export default function UploadDropzone() {
  const dispatch = useDispatch()
  const fileInput = useRef(null)
  const [scope, setScope] = useState('derm')
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files) => {
    const items = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      scope,
      status: 'pending',
      progress: 0,
    }))
    dispatch(addToQueue(items))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Scope selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category:</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
        >
          {SCOPES.map((s) => (
            <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInput.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-medical-500 bg-medical-50 dark:bg-medical-900/10'
            : 'border-gray-300 dark:border-gray-700 hover:border-medical-400'
        }`}
      >
        <Upload size={36} className="mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Images: JPG, PNG, BMP · Videos: MP4, AVI, MOV, WebM
        </p>
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        accept={[...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.video].join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  )
}

