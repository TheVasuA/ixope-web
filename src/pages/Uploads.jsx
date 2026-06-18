import { useSelector, useDispatch } from 'react-redux'
import { retryAllFailed, removeFromQueue } from '../store/slices/uploadSlice'
import UploadDropzone from '../components/ui/UploadDropzone'
import { Upload, CheckCircle, XCircle, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { formatFileSize } from '../utils/formatters'
import { useUploadProcessor } from '../hooks/useUploadProcessor'

export default function Uploads() {
  const dispatch = useDispatch()
  const { queue, history } = useSelector((state) => state.upload)

  // Process queue whenever items change
  useUploadProcessor()

  const failedCount = queue.filter((i) => i.status === 'error').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Manager</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload captures to IXOPE Hub</p>
      </div>

      {/* Dropzone */}
      <UploadDropzone />

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Upload Queue ({queue.length})</h2>
            {failedCount > 0 && (
              <button onClick={() => dispatch(retryAllFailed())} className="btn-secondary text-sm flex items-center gap-1.5">
                <RotateCcw size={14} /> Retry Failed ({failedCount})
              </button>
            )}
          </div>

          <div className="space-y-2">
            {queue.map((item) => (
              <div key={item.id} className="medical-card flex items-center gap-3 py-3 px-4">
                {/* Status icon */}
                {item.status === 'pending' && <Upload size={16} className="text-gray-400 flex-shrink-0" />}
                {item.status === 'uploading' && <Loader2 size={16} className="text-medical-500 animate-spin flex-shrink-0" />}
                {item.status === 'success' && <CheckCircle size={16} className="text-green-500 flex-shrink-0" />}
                {item.status === 'error' && <XCircle size={16} className="text-red-500 flex-shrink-0" />}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(item.size)} · {item.scope}
                    {item.error && <span className="text-red-500 ml-2">{item.error}</span>}
                  </p>
                </div>

                {/* Progress */}
                {item.status === 'uploading' && (
                  <div className="w-20">
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-medical-500 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-0.5">{item.progress}%</p>
                  </div>
                )}

                {/* Remove */}
                <button
                  onClick={() => dispatch(removeFromQueue(item.id))}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-600 dark:text-gray-400">Upload History</h2>
          <div className="space-y-1">
            {history.slice(0, 20).map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                <span className="truncate flex-1">{item.name}</span>
                <span className="text-xs">{formatFileSize(item.size)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

