// Security Dashboard - Advanced security monitoring and management
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  MapPin, 
  Clock, 
  Users,
  Activity,
  Download,
  RefreshCw,
  Search
} from 'lucide-react'

interface SecurityEvent {
  id: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  user_id?: string
  user_name?: string
  device_id?: string
  device_info?: string
  ip_address: string
  location?: {
    latitude: number
    longitude: number
    accuracy: number
    address?: string
  }
  user_agent: string
  created_at: string
}

interface SecurityStats {
  total_events: number
  events_by_severity: Array<{ severity: string; count: number }>
  events_by_type: Array<{ event_type: string; count: number }>
  recent_suspicious_activity: number
  unique_users_tracked: number
  devices_checked_today: number
  high_risk_locations: Array<{
    location: string
    risk_score: number
    event_count: number
  }>
}

function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    severity: '',
    eventType: '',
    timeRange: '24h',
    page: 1,
    limit: 50,
  })

  useEffect(() => {
    loadSecurityData()
    const interval = setInterval(loadSecurityData, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadSecurityData = async () => {
    try {
      setLoading(true)

      const [eventsResponse, statsResponse] = await Promise.all([
        fetch(
          `/api/admin-system/security-events?${new URLSearchParams({
            page: filters.page.toString(),
            limit: filters.limit.toString(),
            ...(filters.severity && { severity: filters.severity }),
            ...(filters.eventType && { eventType: filters.eventType }),
            ...(filters.timeRange && { timeRange: filters.timeRange }),
          })}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
          }
        ),
        fetch('/api/admin-system/security-stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }),
      ])

      if (!eventsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to load security data')
      }

      const eventsData = await eventsResponse.json()
      const statsData = await statsResponse.json()

      setEvents(eventsData.events || [])
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-800 bg-red-100 border-red-200'
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle size={16} />
      case 'medium':
        return <Eye size={16} />
      case 'low':
        return <Activity size={16} />
      default:
        return <Shield size={16} />
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const exportSecurityReport = async () => {
    try {
      const response = await fetch('/api/admin-system/security-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          timeRange: filters.timeRange,
          severity: filters.severity,
          eventType: filters.eventType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Error generating report: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading security dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">Monitor security events and system activity</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={loadSecurityData} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          <button onClick={exportSecurityReport} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield size={24} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_events}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspicious Activity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recent_suspicious_activity}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Users Tracked</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unique_users_tracked}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity size={24} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Devices Checked Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.devices_checked_today}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Events by Severity</h3>
            <div className="space-y-3">
              {(stats.events_by_severity || []).map((item) => (
                <div key={item.severity} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${item.severity === 'critical' ? 'bg-red-600' : item.severity === 'high' ? 'bg-red-400' : item.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'}`}></div>
                    <span className="text-sm font-medium capitalize">{item.severity}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">High Risk Locations</h3>
            <div className="space-y-3">
              {(stats.high_risk_locations || []).slice(0, 5).map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin size={16} className="text-red-500 mr-2" />
                    <span className="text-sm font-medium">{location.location}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">Risk: {location.risk_score.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">{location.event_count} events</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search events..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select value={filters.eventType} onChange={(e) => setFilters({ ...filters, eventType: e.target.value, page: 1 })} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Event Types</option>
            <option value="device_check">Device Check</option>
            <option value="suspicious_location">Suspicious Location</option>
            <option value="multiple_devices">Multiple Devices</option>
            <option value="ownership_transfer">Ownership Transfer</option>
            <option value="failed_verification">Failed Verification</option>
          </select>

          <select value={filters.timeRange} onChange={(e) => setFilters({ ...filters, timeRange: e.target.value, page: 1 })} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(event.severity)}`}>
                      {getSeverityIcon(event.severity)}
                      <span className="ml-1 capitalize">{event.severity}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatEventType(event.event_type)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={event.description}>{event.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.user_name ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{event.user_name}</div>
                        <div className="text-sm text-gray-500">{event.ip_address}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">{event.ip_address}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.location ? (
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1" />
                        <span>{event.location.address || `${event.location.latitude.toFixed(4)}, ${event.location.longitude.toFixed(4)}`}</span>
                      </div>
                    ) : (
                      'Unknown'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      <span>{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {events.length === 0 && <div className="text-center py-8 text-gray-500">No security events found for the selected criteria.</div>}
      </div>
    </div>
  )
}

export default SecurityDashboard
export { SecurityDashboard }