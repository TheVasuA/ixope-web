import { useState } from 'react'
import { useGetHealthQuery } from '../services/api'
import { DEVICE_ID, SERVER_URL, POLLING_INTERVAL } from '../config/device'
import { Activity, Wifi, WifiOff, Camera, RefreshCw, Server, Globe } from 'lucide-react'
import { formatRelativeTime } from '../utils/formatters'

export default function DeviceManagement() {
  const { data: health, isLoading, refetch, isFetching } = useGetHealthQuery(undefined, { pollingInterval: POLLING_INTERVAL })
  const [testResult, setTestResult] = useState(null)

  const isOnline = health?.status === 'ok'

  const handleTestConnection = async () => {
    setTestResult(null)
    try {
      const start = Date.now()
      await refetch()
      const latency = Date.now() - start
      setTestResult({ success: true, latency })
    } catch (err) {
      setTestResult({ success: false, error: err.message })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor and configure your IXOPE device connection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <div className="medical-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity size={18} className="text-medical-500" /> Connection Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Camera</span>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${health?.camera === 'available' ? 'text-green-600' : 'text-amber-500'}`}>
                <Camera size={14} />
                {health?.camera || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Last Health Check</span>
              <span className="text-sm">{formatRelativeTime(health?.timestamp)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Polling Interval</span>
              <span className="text-sm">{POLLING_INTERVAL / 1000}s</span>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isFetching}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            Test Connection
          </button>

          {testResult && (
            <div className={`text-sm p-3 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
              {testResult.success
                ? `Connection successful (${testResult.latency}ms latency)`
                : `Connection failed: ${testResult.error}`}
            </div>
          )}
        </div>

        {/* Device Configuration */}
        <div className="medical-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Server size={18} className="text-medical-500" /> Configuration
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Device ID</p>
              <p className="text-sm font-mono mt-1">{DEVICE_ID}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Flask Server</p>
              <p className="text-sm font-mono mt-1">{SERVER_URL}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hub Server</p>
              <p className="text-sm font-mono mt-1">{SERVER_URL}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


