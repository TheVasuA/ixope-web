import { SCOPES } from '../config/device'
import ScopeCard from '../components/ui/ScopeCard'

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview</p>
      </div>

      {/* Scope Cards with recent gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCOPES.map((scope) => (
          <ScopeCard key={scope} scope={scope} />
        ))}
      </div>
    </div>
  )
}
