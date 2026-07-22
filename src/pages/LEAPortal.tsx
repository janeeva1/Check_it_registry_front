import { useEffect, useState } from 'react'
import { apiClient } from '../lib/apiClient'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { Loading } from '../components/Loading'
import { ButtonLoading } from '../components/Loading'
import { Activity, AlertTriangle, CheckCircle2, FileSearch, MapPin } from 'lucide-react'

interface LEAStats {
  total_cases: number
  open_cases: number
  under_review_cases: number
  resolved_cases: number
  cases_24h: number
  regional_cases: number
  // Optional extended metrics for richer dashboard visuals
  devices_recovered?: number
  stolen_reports?: number
  loss_reports?: number
  average_resolution_time_days?: number
  cases_last_7_days?: number[]
}

interface Case {
  case_id: string
  device_id: string
  // Backend uses 'stolen' | 'lost' | 'found'. Keep flexible to avoid TS mismatches.
  report_type: string
  // Align with backend valid statuses: open, under_review, resolved, dismissed
  status: 'open' | 'under_review' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  device_brand?: string
  device_model?: string
  device_imei?: string
  reporter_name?: string
  reporter_email?: string
  location?: string
  description?: string
  notes?: string
}

export default function LEAPortal() {
  const [stats, setStats] = useState<LEAStats | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState<boolean>(false)
  const [authChecked, setAuthChecked] = useState<boolean>(false)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [caseNotes, setCaseNotes] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'regional'>('overview')
  const [caseFilter, setCaseFilter] = useState<'all' | 'open' | 'under_review' | 'resolved'>('all')
  const [updatingCase, setUpdatingCase] = useState<string | null>(null)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const [statsError, setStatsError] = useState<string | null>(null)
  const [casesError, setCasesError] = useState<string | null>(null)

  const loadLEAData = async () => {
    setLoading(true)
    try {
      const [statsResult, casesResult] = await Promise.allSettled([
        apiClient.leaPortal.stats(),
        apiClient.leaPortal.cases({ status: caseFilter === 'all' ? undefined : caseFilter })
      ])

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.stats)
        setStatsError(null)
      } else {
        console.error('LEA stats load error:', statsResult.reason)
        setStats(null)
        setStatsError(
          (statsResult.reason && (statsResult.reason.message || statsResult.reason.error)) ||
          'Unable to load dashboard statistics'
        )
      }

      if (casesResult.status === 'fulfilled') {
        setCases(casesResult.value.cases || [])
        setCasesError(null)
      } else {
        console.error('LEA cases load error:', casesResult.reason)
        setCases([])
        setCasesError(
          (casesResult.reason && (casesResult.reason.message || casesResult.reason.error)) ||
          'Unable to load cases'
        )
      }
    } catch (err) {
      console.error('Error loading LEA data:', err)
      showError('Loading Error', 'Failed to load LEA portal data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCaseStatus = async (caseId: string, status: string) => {
    try {
      setUpdatingCase(caseId)
      
      await apiClient.leaPortal.updateCaseStatus(caseId, { status })
      
      showSuccess('Case Updated', `Case status updated to ${status}`)
      await loadLEAData()
      setSelectedCase(null)
    } catch (err) {
      console.error('Error updating case:', err)
      showError('Update Failed', 'Failed to update case status')
    } finally {
      setUpdatingCase(null)
    }
  }

  const handleAddCaseNotes = async (caseId: string, notes: string) => {
    try {
      setUpdatingCase(caseId)
      
      await apiClient.leaPortal.addCaseNotes(caseId, { notes })
      
      showSuccess('Notes Added', 'Case notes have been added successfully')
      await loadLEAData()
      setCaseNotes('')
    } catch (err) {
      console.error('Error adding notes:', err)
      showError('Update Failed', 'Failed to add case notes')
    } finally {
      setUpdatingCase(null)
    }
  }

  const openCaseModal = (caseItem: Case) => {
    setSelectedCase(caseItem)
    setNewStatus(caseItem.status)
    setCaseNotes('')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4444'
      case 'high': return '#ff8844'
      case 'medium': return '#ffaa44'
      case 'low': return '#44aa44'
      default: return '#aaa'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#ff4444'
      case 'under_review': return '#ffaa44'
      case 'resolved': return '#44aa44'
      case 'dismissed': return '#888'
      default: return '#aaa'
    }
  }

  const formatLabel = (value: string) => (value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  // Preflight auth and role check before loading data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await apiClient.auth.getSession()
        const role = data.session?.user?.role

        if (!data.session) {
          setStats(null)
          setStatsError('Please sign in to access the LEA portal')
          setAuthorized(false)
          setLoading(false)
          return
        }

        if (role !== 'admin' && role !== 'lea') {
          setStats(null)
          setStatsError('LEA or admin access required for this portal')
          setAuthorized(false)
          setLoading(false)
          return
        }

        setAuthorized(true)
        await loadLEAData()
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (authorized) {
      loadLEAData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseFilter, authorized])

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'lea']}>
        <Loading size="large" message="Loading LEA portal..." />
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['admin', 'lea']}>
      <div className="lea-portal container py-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="h4 m-0">LEA Portal</h1>
            <small className="text-secondary">Law Enforcement Agency case management and investigation tools</small>
          </div>
          <div className="d-none d-md-flex align-items-center gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => setActiveTab('cases')}>View Cases</button>
            <button className="btn btn-primary btn-sm" onClick={() => setCaseFilter('open')}>Open Cases</button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs" style={{ marginBottom: '2rem' }}>
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            📋 Case Management
          </button>
          <button 
            className={`tab-button ${activeTab === 'regional' ? 'active' : ''}`}
            onClick={() => setActiveTab('regional')}
          >
            🗺️ Regional Stats
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="overview-tab">
            {/* KPI Row */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="modern-card p-3 d-flex align-items-center gap-3">
                  <div className="rounded-3 p-2" style={{ backgroundColor: 'var(--primary-50)' }}>
                    <Activity className="text-primary" size={20} />
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>Total Cases</div>
                    <div className="h4 m-0" style={{ color: 'var(--primary-600)' }}>{stats.total_cases}</div>
                    <small className="text-secondary">All time</small>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="modern-card p-3 d-flex align-items-center gap-3">
                  <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(255, 68, 68, 0.08)' }}>
                    <AlertTriangle className="" color="#ff4444" size={20} />
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>Open Cases</div>
                    <div className="h4 m-0" style={{ color: '#ff4444' }}>{stats.open_cases}</div>
                    <small className="text-secondary">Requiring attention</small>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="modern-card p-3 d-flex align-items-center gap-3">
                  <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(255, 170, 68, 0.12)' }}>
                    <FileSearch color="#ffaa44" size={20} />
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>Under Review</div>
                    <div className="h4 m-0" style={{ color: '#ffaa44' }}>{stats.under_review_cases}</div>
                    <small className="text-secondary">Being investigated</small>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="modern-card p-3 d-flex align-items-center gap-3">
                  <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(68, 170, 68, 0.10)' }}>
                    <CheckCircle2 color="#44aa44" size={20} />
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>Resolved</div>
                    <div className="h4 m-0" style={{ color: '#44aa44' }}>{stats.resolved_cases}</div>
                    <small className="text-secondary">Successfully closed</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Row: Recent + Distribution */}
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <div className="modern-card p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h4 className="h6 m-0">Recent Activity</h4>
                    <small className="text-secondary">Last 24 hours</small>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="d-flex align-items-center gap-2"><Activity size={16} className="text-primary" />New Cases</span>
                      <strong>{stats.cases_24h}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="d-flex align-items-center gap-2"><MapPin size={16} className="text-secondary" />Regional Cases</span>
                      <strong>{stats.regional_cases}</strong>
                    </div>
                  </div>
                  {/* Trend bars (simple visual if data available) */}
                  {!!stats.cases_last_7_days?.length && (
                    <div className="mt-3">
                      <small className="text-secondary">New cases (7 days)</small>
                      <div className="d-flex align-items-end gap-1" style={{ height: '56px' }}>
                        {stats.cases_last_7_days.map((v, i) => (
                          <div key={i} style={{ width: '14%', minWidth: '14px', height: Math.max(6, v) + 8, backgroundColor: 'var(--primary-400)', borderRadius: '4px' }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="modern-card p-3">
                  <h4 className="h6 m-0 mb-2">Case Status Distribution</h4>
                  {(() => {
                    const total = Math.max(1, stats.total_cases);
                    const pctOpen = Math.round((stats.open_cases / total) * 100);
                    const pctReview = Math.round((stats.under_review_cases / total) * 100);
                    const pctResolved = Math.round((stats.resolved_cases / total) * 100);
                    return (
                      <div>
                        <div className="progress" style={{ height: '18px', backgroundColor: 'var(--bg-secondary)' }}>
                          <div className="progress-bar" role="progressbar" style={{ width: `${pctOpen}%`, backgroundColor: '#ff6666' }} aria-valuenow={pctOpen} aria-valuemin={0} aria-valuemax={100}></div>
                          <div className="progress-bar" role="progressbar" style={{ width: `${pctReview}%`, backgroundColor: '#ffcc66' }} aria-valuenow={pctReview} aria-valuemin={0} aria-valuemax={100}></div>
                          <div className="progress-bar" role="progressbar" style={{ width: `${pctResolved}%`, backgroundColor: '#66cc66' }} aria-valuenow={pctResolved} aria-valuemin={0} aria-valuemax={100}></div>
                        </div>
                        <div className="d-flex justify-content-between mt-2">
                          <small className="text-secondary">Open: {pctOpen}%</small>
                          <small className="text-secondary">Under Review: {pctReview}%</small>
                          <small className="text-secondary">Resolved: {pctResolved}%</small>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="d-flex flex-column gap-2 mt-3">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => setActiveTab('cases')}>Manage Cases</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveTab('regional')}>Regional Analysis</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && !stats && (
          <div className="overview-tab">
            <div className="modern-card p-4 text-center">
              <h4 className="h6 m-0 mb-2">No LEA data available</h4>
              <small className="text-secondary">
                {statsError || 'Ensure your LEA agency is configured for your region or use an admin account.'}
              </small>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-primary btn-sm" onClick={loadLEAData}>Refresh Data</button>
                <a className="btn btn-outline-secondary btn-sm" href="/lea/settings">Open LEA Settings</a>
              </div>
            </div>
          </div>
        )}

        {/* Cases Tab */}
        {activeTab === 'cases' && (
          <div className="cases-tab">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Case Management</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={caseFilter} 
                    onChange={(e) => setCaseFilter(e.target.value as any)}
                    style={{ padding: '0.5rem' }}
                  >
                    <option value="all">All Cases</option>
                    <option value="open">Open Cases</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved Cases</option>
                  </select>
                  <button className="btn-secondary btn-sm">📊 Export Cases</button>
                </div>
              </div>

              {casesError && (
                <div className="alert alert-warning" role="alert">
                  {casesError}
                </div>
              )}

              {cases.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '2rem' }}>
                  No cases found for the selected filter
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Type</th>
                      <th>Device</th>
                      <th>Reporter</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map(caseItem => (
                      <tr key={caseItem.case_id}>
                        <td>
                          <strong>{caseItem.case_id}</strong>
                        </td>
                        <td>
                          <span className={`status-badge status-${caseItem.report_type}`}>
                            {formatLabel(caseItem.report_type)}
                          </span>
                        </td>
                        <td>
                          <div>{caseItem.device_brand} {caseItem.device_model}</div>
                          <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                            {caseItem.device_imei || 'No IMEI'}
                          </div>
                        </td>
                        <td>
                          <div>{caseItem.reporter_name}</div>
                          <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                            {caseItem.reporter_email}
                          </div>
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(caseItem.status) }}
                          >
                            {formatLabel(caseItem.status)}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="priority-badge"
                            style={{ 
                              backgroundColor: getPriorityColor(caseItem.priority),
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            {caseItem.priority}
                          </span>
                        </td>
                        <td>{new Date(caseItem.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => openCaseModal(caseItem)}
                            className="btn-primary btn-sm"
                            disabled={updatingCase === caseItem.case_id}
                          >
                            {updatingCase === caseItem.case_id ? <ButtonLoading /> : '👁️ View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Regional Tab */}
        {activeTab === 'regional' && (
          <div className="regional-tab">
            <div className="card">
              <h2>Regional Statistics</h2>
              <p>Regional crime analysis and statistics coming soon...</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn-primary">🗺️ Crime Hotspots</button>
                <button className="btn-secondary">📊 Regional Trends</button>
                <button className="btn-secondary">📈 Performance Metrics</button>
              </div>
            </div>
          </div>
        )}

        {/* Case Details Modal */}
        {selectedCase && (
          <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Case Details - {selectedCase.case_id}</h3>
                <button 
                  className="modal-close"
                  onClick={() => setSelectedCase(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="case-details">
                  <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                    <div>
                      <h4>Case Information</h4>
                      <p><strong>Type:</strong> {selectedCase.report_type}</p>
                      <p><strong>Status:</strong> {selectedCase.status}</p>
                      <p><strong>Priority:</strong> {selectedCase.priority}</p>
                      <p><strong>Created:</strong> {new Date(selectedCase.created_at).toLocaleString()}</p>
                      <p><strong>Updated:</strong> {new Date(selectedCase.updated_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4>Device Information</h4>
                      <p><strong>Brand:</strong> {selectedCase.device_brand}</p>
                      <p><strong>Model:</strong> {selectedCase.device_model}</p>
                      <p><strong>IMEI:</strong> {selectedCase.device_imei || 'Not provided'}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <h4>Reporter Information</h4>
                    <p><strong>Name:</strong> {selectedCase.reporter_name}</p>
                    <p><strong>Email:</strong> {selectedCase.reporter_email}</p>
                    <p><strong>Location:</strong> {selectedCase.location || 'Not specified'}</p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <h4>Description</h4>
                    <p>{selectedCase.description || 'No description provided'}</p>
                  </div>

                  {selectedCase.notes && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4>Existing Notes</h4>
                      <p style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', borderRadius: '4px' }}>
                        {selectedCase.notes}
                      </p>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="case-status">Update Status</label>
                    <select
                      id="case-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="under_review">Under Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="case-notes">Add Notes</label>
                    <textarea
                      id="case-notes"
                      value={caseNotes}
                      onChange={(e) => setCaseNotes(e.target.value)}
                      placeholder="Add investigation notes, updates, or comments..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                {caseNotes && (
                  <button
                    onClick={() => handleAddCaseNotes(selectedCase.case_id, caseNotes)}
                    className="btn-primary"
                    disabled={updatingCase === selectedCase.case_id}
                  >
                    {updatingCase === selectedCase.case_id ? <ButtonLoading /> : '📝 Add Notes'}
                  </button>
                )}
                {newStatus !== selectedCase.status && (
                  <button
                    onClick={() => handleUpdateCaseStatus(selectedCase.case_id, newStatus)}
                    className="btn-success"
                    disabled={updatingCase === selectedCase.case_id}
                  >
                    {updatingCase === selectedCase.case_id ? <ButtonLoading /> : '✅ Update Status'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}