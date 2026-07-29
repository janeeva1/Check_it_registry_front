import React, { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/Layout'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, Calendar, Clock, MapPin, User, Smartphone, FileText, Edit3, Save, X, Shield } from 'lucide-react'

type TimelineItem = {
  id: number
  action: string
  message: string
  created_at: string
  user_name?: string
}

type AdminCaseDetailsResponse = {
  report: any
  device: any
  reporter: any
  lea: any
  timeline?: TimelineItem[]
  admin_notes?: string
}

export default function AdminCaseDetails() {
  const { caseId } = useParams()
  const [data, setData] = useState<AdminCaseDetailsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function load() {
      if (!caseId) return
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`/api/admin-dashboard/reports/${caseId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error(`Failed to load case: ${res.status}`)
        const json = await res.json()
        if (isMounted) {
          setData(json)
          setAdminNotes(json.admin_notes || '')
        }
      } catch (err: any) {
        console.error('Load admin case details error:', err)
        if (isMounted) setError(err.message || 'Failed to load')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [caseId])

  const handleSaveNotes = async () => {
    if (!caseId) return
    setSavingNotes(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/admin-dashboard/reports/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ admin_notes: adminNotes }),
      })
      if (!res.ok) throw new Error(`Failed to save notes: ${res.status}`)
      setData(prev => prev ? { ...prev, admin_notes: adminNotes } : null)
      setEditingNotes(false)
    } catch (err: any) {
      console.error('Save admin notes error:', err)
      setError(err.message || 'Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!caseId) return
    setStatusUpdating(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/admin-dashboard/reports/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error(`Failed to update status: ${res.status}`)
      const _updatedData = await res.json()
      setData(prev => prev ? { ...prev, report: { ...prev.report, status: newStatus } } : null)
    } catch (err: any) {
      console.error('Update status error:', err)
      setError(err.message || 'Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const title = useMemo(() => `Admin Case #${caseId}`, [caseId])

  return (
    <Layout requireAuth>
      <div className="container py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h2 className="fw-bold m-0">{title}</h2>
            <p className="text-secondary m-0">Admin case management and investigation</p>
          </div>
          <Link to="/admin/report-management" className="btn btn-outline-secondary">Back to Reports</Link>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-3">
            <AlertTriangle size={18} className="me-2" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="modern-card p-4 mb-3">
            <div className="placeholder-glow">
              <span className="placeholder col-12" style={{ height: 20 }}></span>
            </div>
          </div>
        )}

        {data && (
          <div className="row g-4">
            <div className="col-lg-8">
              {/* Admin Notes Section */}
              <div className="modern-card p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Shield size={18} />
                    <h3 className="h6 m-0">Admin Notes</h3>
                  </div>
                  {!editingNotes && (
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setEditingNotes(true)}
                    >
                      <Edit3 size={14} className="me-1" />
                      Edit
                    </button>
                  )}
                </div>
                
                {editingNotes ? (
                  <div>
                    <textarea
                      className="form-control mb-3"
                      rows={4}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal admin notes, investigation details, or case management notes..."
                    />
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                      >
                        <Save size={14} className="me-1" />
                        {savingNotes ? 'Saving...' : 'Save'}
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setEditingNotes(false)
                          setAdminNotes(data.admin_notes || '')
                        }}
                      >
                        <X size={14} className="me-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', minHeight: '60px' }}>
                    {data.admin_notes || <span className="text-muted">No admin notes yet. Click Edit to add internal notes.</span>}
                  </div>
                )}
              </div>

              {/* Report Details */}
              <div className="modern-card p-4 mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FileText size={18} />
                  <h3 className="h6 m-0">Report Details</h3>
                </div>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="text-secondary" style={{ fontSize: 13 }}>Type</div>
                    <div className="fw-medium text-capitalize">{data.report?.report_type || 'N/A'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="text-secondary" style={{ fontSize: 13 }}>Status</div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-medium text-capitalize">{data.report?.status || 'N/A'}</span>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                          type="button" 
                          data-bs-toggle="dropdown"
                          disabled={statusUpdating}
                        >
                          {statusUpdating ? 'Updating...' : 'Change'}
                        </button>
                        <ul className="dropdown-menu">
                          <li><button className="dropdown-item" onClick={() => handleStatusUpdate('open')}>Open</button></li>
                          <li><button className="dropdown-item" onClick={() => handleStatusUpdate('under_review')}>Under Review</button></li>
                          <li><button className="dropdown-item" onClick={() => handleStatusUpdate('resolved')}>Resolved</button></li>
                          <li><button className="dropdown-item" onClick={() => handleStatusUpdate('dismissed')}>Dismissed</button></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: 13 }}>
                      <Calendar size={14} /> Reported
                    </div>
                    <div className="fw-medium">{data.report?.created_at ? new Date(data.report.created_at).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: 13 }}>
                      <Clock size={14} /> Occurred
                    </div>
                    <div className="fw-medium">{data.report?.occurred_at ? new Date(data.report.occurred_at).toLocaleString() : 'N/A'}</div>
                  </div>
                  {data.report?.location && (
                    <div className="col-12">
                      <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: 13 }}>
                        <MapPin size={14} /> Location
                      </div>
                      <div className="fw-medium">{data.report.location}</div>
                    </div>
                  )}
                  {data.report?.description && (
                    <div className="col-12">
                      <div className="text-secondary" style={{ fontSize: 13 }}>Description</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{data.report.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="modern-card p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FileText size={18} />
                  <h3 className="h6 m-0">Case Timeline</h3>
                </div>
                {data.timeline && data.timeline.length > 0 ? (
                  <div className="list-group">
                    {data.timeline.map(item => (
                      <div key={item.id} className="list-group-item border-0 px-0">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-medium">{String(item.action || '').replace(/_/g, ' ')}</div>
                            <div className="text-secondary" style={{ fontSize: 13 }}>{item.message}</div>
                          </div>
                          <div className="text-secondary" style={{ fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</div>
                        </div>
                        {item.user_name && (
                          <div className="text-secondary" style={{ fontSize: 12 }}>By {item.user_name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">No timeline entries yet.</div>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              {/* Device Info */}
              <div className="modern-card p-4 mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Smartphone size={18} />
                  <h3 className="h6 m-0">Device</h3>
                </div>
                {data.device ? (
                  <div>
                    <div className="fw-medium">{data.device.brand} {data.device.model}</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>IMEI: {data.device.imei || 'N/A'}</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>Serial: {data.device.serial || 'N/A'}</div>
                    <div className="d-flex gap-2 mt-2">
                      <Link to={`/admin/devices/${data.device.id}`} className="btn btn-sm btn-outline-primary">Admin View</Link>
                      <Link to={`/device/${data.device.id}`} className="btn btn-sm btn-outline-secondary">User View</Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary">No device info</div>
                )}
              </div>

              {/* Reporter Info */}
              <div className="modern-card p-4 mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <User size={18} />
                  <h3 className="h6 m-0">Reporter</h3>
                </div>
                {data.reporter ? (
                  <div>
                    <div className="fw-medium">{data.reporter.name}</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>{data.reporter.email}</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>ID: {data.reporter.id}</div>
                  </div>
                ) : (
                  <div className="text-secondary">No reporter info</div>
                )}
              </div>

              {/* LEA Assignment */}
              {data.lea && (
                <div className="modern-card p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <User size={18} />
                    <h3 className="h6 m-0">Assigned Officer</h3>
                  </div>
                  <div>
                    <div className="fw-medium">{data.lea.name}</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>{data.lea.email}</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>Badge: {data.lea.badge_number || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}