import { useRef, useEffect, useState } from 'react'
import { useGetHealthQuery } from '../services/api'
import { DEVICE_URL, POLLING_INTERVAL } from '../config/device'
import { Video, WifiOff, Camera } from 'lucide-react'

export default function LiveFeed() {
  const imgRef = useRef(null)
  const [streamError, setStreamError] = useState(false)
  const { data: health } = useGetHealthQuery(undefined, { pollingInterval: POLLING_INTERVAL })
  const isOnline = health?.status === 'ok'
  const cameraAvailable = health?.camera === 'available'
  const canStream = isOnline && cameraAvailable

  useEffect(() => {
    // Cleanup MJPEG stream on unmount
    return () => {
      if (imgRef.current) {
        imgRef.current.src = ''
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Feed</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time camera stream from your IXOPE device</p>
      </div>

      <div className="medical-card overflow-hidden">
        {canStream && !streamError ? (
          <div className="relative">
            <img
              ref={imgRef}
              src={`${SERVER_URL}/live_feed`}
              alt="Live camera feed"
              className="w-full rounded-lg bg-black"
              onError={() => setStreamError(true)}
            />
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {!isOnline ? (
              <>
                <WifiOff size={48} className="text-red-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Device Offline</p>
                <p className="text-sm text-gray-500 mt-1">Connect your IXOPE device to view live feed</p>
              </>
            ) : !cameraAvailable ? (
              <>
                <Camera size={48} className="text-amber-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Camera Unavailable</p>
                <p className="text-sm text-gray-500 mt-1">The device camera is not accessible right now</p>
              </>
            ) : (
              <>
                <Video size={48} className="text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Feed Unavailable</p>
                <p className="text-sm text-gray-500 mt-1">Could not load the live feed stream</p>
                <button
                  onClick={() => setStreamError(false)}
                  className="mt-4 btn-primary"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


