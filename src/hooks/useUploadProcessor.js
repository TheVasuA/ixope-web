import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUploadStatus, moveToHistory } from '../store/slices/uploadSlice'
import { DEVICE_ID, UPLOAD_IMAGE_URL, UPLOAD_VIDEO_URL } from '../config/device'

const MAX_CONCURRENT = 3

export function useUploadProcessor() {
  const dispatch = useDispatch()
  const queue = useSelector((state) => state.upload.queue)
  const processingRef = useRef(new Set())

  useEffect(() => {
    const pending = queue.filter((i) => i.status === 'pending')
    const activeCount = queue.filter((i) => i.status === 'uploading').length

    const slotsAvailable = MAX_CONCURRENT - activeCount - processingRef.current.size
    if (slotsAvailable <= 0 || pending.length === 0) return

    const toProcess = pending.slice(0, slotsAvailable)

    toProcess.forEach((item) => {
      if (processingRef.current.has(item.id)) return
      processingRef.current.add(item.id)

      dispatch(updateUploadStatus({ id: item.id, status: 'uploading', progress: 0 }))

      const isVideo = item.type?.startsWith('video/')
      const baseUrl = isVideo ? UPLOAD_VIDEO_URL : UPLOAD_IMAGE_URL
      const endpoint = `${baseUrl}?id=${DEVICE_ID}&scope=${item.scope || 'general'}`

      const formData = new FormData()
      formData.append('file', item.file)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', endpoint)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          dispatch(updateUploadStatus({ id: item.id, status: 'uploading', progress }))
        }
      }

      xhr.onload = () => {
        processingRef.current.delete(item.id)
        if (xhr.status === 200) {
          dispatch(updateUploadStatus({ id: item.id, status: 'success', progress: 100 }))
          setTimeout(() => dispatch(moveToHistory(item.id)), 2000)
        } else {
          dispatch(updateUploadStatus({ id: item.id, status: 'error', error: `HTTP ${xhr.status}` }))
        }
      }

      xhr.onerror = () => {
        processingRef.current.delete(item.id)
        dispatch(updateUploadStatus({ id: item.id, status: 'error', error: 'Network error' }))
      }

      xhr.send(formData)
    })
  }, [queue, dispatch])
}

