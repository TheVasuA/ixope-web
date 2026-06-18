import { useState } from 'react'
import { formatFileSize } from '../../utils/formatters'
import { SERVER_URL } from '../../config/device'
import { ImageOff } from 'lucide-react'

export default function ImageGrid({ images = [], onImageClick, selectable = false, selectedIds = [], onSelectionChange }) {
  const [failedImages, setFailedImages] = useState(new Set())

  const handleError = (filename) => {
    setFailedImages((prev) => new Set([...prev, filename]))
  }

  const handleSelect = (img) => {
    if (!onSelectionChange) return
    const isSelected = selectedIds.includes(img.filename)
    if (isSelected) {
      onSelectionChange(selectedIds.filter((id) => id !== img.filename))
    } else {
      onSelectionChange([...selectedIds, img.filename])
    }
  }

  if (!images.length) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {images.map((img, idx) => {
        // Use the file URL directly
        const imgSrc = img.url
          ? `${SERVER_URL}${img.url}`
          : img.thumbnail_url
            ? `${SERVER_URL}${img.thumbnail_url}`
            : ''

        return (
          <div
            key={img.id || img.filename}
            className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square cursor-pointer ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-medical-400 hover:shadow-lg transition-all duration-200"
            onClick={() => selectable ? handleSelect(img) : onImageClick?.(idx)}
          >
            {/* Selection checkbox */}
            {selectable && (
              <div className="absolute top-2 left-2 z-10">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                  selectedIds.includes(img.filename)
                    ? 'bg-medical-500 border-medical-500 scale-110'
                    : 'border-white/70 bg-black/30 backdrop-blur-sm'
                }`}>
                  {selectedIds.includes(img.filename) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            )}

            {/* Image thumbnail */}
            {failedImages.has(img.filename) ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <ImageOff size={24} />
                <span className="text-xs text-center px-2">Not available</span>
              </div>
            ) : (
              <img
                src={imgSrc}
                alt={img.original_filename || img.filename}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => handleError(img.filename)}
              />
            )}

            {/* Hover overlay with info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-white text-xs font-medium truncate">{img.original_filename || img.filename}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/60 text-xs">{formatFileSize(img.file_size || img.size)}</span>
                <span className="text-white/40 text-xs">•</span>
                <span className="text-medical-300 text-xs uppercase font-medium">{img.scope}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
