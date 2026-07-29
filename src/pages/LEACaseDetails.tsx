import React, { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { useParams, Link } from 'react-router-dom'
import { Search, Smartphone, User, Calendar, AlertTriangle } from 'lucide-react'

type CaseDetails = {
  report: any
  device: any
  reporter: any
  lea: any
}

export default function LEACaseDetails() {
  const { id } = useParams()
  const [data, setData] = useState<CaseDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/lea-portal/cases/${id}`)
        if (!res.ok) throw new Error(`Failed to load case: ${res.status}`)
      const json = await res.json()
        if (isMounted) {
          setData(json)
          setNewStatus(json?.report?.status || '')
        }
      } catch (err: any) {
        console.error('Load LEA case error:', err)
        if (isMounted) setError(err.message || 'Failed to load')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [id])

  async function updateStatus() {
    if (!id || !newStatus) return
    setStatusUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/lea-portal/cases/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      const _json = await res.json()
      // reload minimal state
      if (data) setData({ ...data, report: { ...data.report, status: newStatus } })
    } catch (err: any) {
      setError(err.message || 'Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  async function saveNote() {
    if (!id || !note.trim()) return
    setNoteSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/lea-portal/cases/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() })
      })
      if (!res.ok) throw new Error('Failed to add note')
      setNote('')
    } catch (err: any) {
      setError(err.message || 'Failed to add note')
    } finally {
      setNoteSaving(false)
    }
  }

  return (
    <Layout requireAuth allowedRoles={["lea", "admin"]}>
      <div className="container py-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <Search />
            <div>
              <h1 className="h5 m-0">LEA Case Details</h1>
              <small className="text-secondary">Case ID: {id || 'N/A'}</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link to="/lea/cases" className="btn btn-outline-secondary">Back to Cases</Link>
            <Link
              to={`/audit-trail?resource=report&q=${encodeURIComponent(String(id))}`}
              className="btn btn-outline-primary"
            >
              Audit Logs
            </Link>
          </div>
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
              <div className="modern-card p-4 mb-4">
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="text-secondary" style={{ fontSize: 13 }}>Type</div>
                    <div className="fw-medium text-capitalize">{data.report?.report_type || 'N/A'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="text-secondary" style={{ fontSize: 13 }}>Status</div>
                    <div className="d-flex gap-2 align-items-center">
                      <select className="form-select form-select-sm" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ maxWidth: 220 }}>
                        <option value="open">Open</option>
                        <option value="under_review">Under Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                      <button className="btn btn-sm btn-outline-primary" onClick={updateStatus} disabled={statusUpdating}>Update</button>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: 13 }}>
                      <Calendar size={14} /> Reported
                    </div>
                    <div className="fw-medium">{data.report?.created_at ? new Date(data.report.created_at).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="col-12">
                    <div className="text-secondary" style={{ fontSize: 13 }}>Description</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{data.report?.description || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="modern-card p-4">
                <h3 className="h6">Add Investigation Note</h3>
                <textarea className="form-control mb-2" rows={4} placeholder="Enter note details" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn btn-outline-primary" onClick={saveNote} disabled={noteSaving || !note.trim()}>Save Note</button>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="modern-card p-4 mb-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Smartphone size={18} />
                  <h3 className="h6 m-0">Device</h3>
                </div>
                {data.device ? (
                  <div>
                    <div className="fw-medium">{data.device.brand} {data.device.model}</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>IMEI: {data.device.imei || 'N/A'}</div>
                    <div className="d-flex gap-2 mt-2">
                      <Link to={`/lea/devices/${data.device.id}`} className="btn btn-sm btn-outline-primary">LEA Device View</Link>
                      <Link to={`/audit-trail?resource=device&q=${encodeURIComponent(String(data.device.id))}`} className="btn btn-sm btn-outline-secondary">Audit Logs</Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary">No device info</div>
                )}
              </div>

              <div className="modern-card p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <User size={18} />
                  <h3 className="h6 m-0">Reporter</h3>
                </div>
                {data.reporter ? (
                  <div>
                    <div className="fw-medium">{data.reporter.name}</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>{data.reporter.email}</div>
                  </div>
                ) : (
                  <div className="text-secondary">No reporter info</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}