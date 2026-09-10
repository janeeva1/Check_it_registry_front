import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'

type DeviceDetails = {
  device: {
    id: number
    brand?: string
    model?: string
    imei?: string
    serial?: string
    status?: string
    owner_name?: string
    owner_email?: string
    owner_phone?: string
    owner_since?: string
  }
  reports: Array<{
    id: number
    type: string
    status: string
    created_at?: string
  }>
  transfers?: Array<{
    id: number
    from_user_id?: number
    to_user_id?: number
    status?: string
    created_at?: string
  }>
  verification_history?: Array<{
    id: number
    action: string
    status?: string
    created_at?: string
  }>
  activity_logs?: Array<{
    id: number
    actor?: string
    action?: string
    created_at?: string
  }>
  check_history?: Array<{
    id: string
    query?: string
    checker_user_id?: string
    checker_name?: string
    checker_email?: string
    ip_address?: string
    location_address?: string
    check_result?: string
    device_status_at_check?: string
    created_at?: string
  }>
}

export default function AdminDeviceDetails() {
  const { id } = useParams()
  const [data, setData] = useState<DeviceDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin-dashboard/devices/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error(`Failed to load device: ${res.status}`)
        const json = await res.json()
        if (mounted) setData(json)
      } catch (err: any) {
        console.error('Admin device details error:', err)
        if (mounted) setError(err.message || 'Failed to load device details')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (id) load()
    return () => { mounted = false }
  }, [id])

  return (
    <Layout>
      <div className="container py-4">
        <div className="d-flex align-items-center mb-3">
          <h2 className="h4 mb-0">Device Details</h2>
          <div className="ms-auto">
            <Link to="/admin/report-management" className="btn btn-outline-secondary btn-sm">Back to Reports</Link>
          </div>
        </div>
        {loading && <p>Loading device details…</p>}
        {error && <div className="alert alert-danger">{error}</div>}
        {!loading && !error && data && (
          <div className="row g-4">
            <div className="col-12 col-lg-5">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Device</h5>
                  <p className="mb-1"><strong>ID:</strong> {data.device.id}</p>
                  {data.device.brand || data.device.model ? (
                    <p className="mb-1"><strong>Model:</strong> {data.device.brand} {data.device.model}</p>
                  ) : null}
                  {data.device.imei ? (
                    <p className="mb-1"><strong>IMEI:</strong> {data.device.imei}</p>
                  ) : null}
                  {data.device.serial ? (
                    <p className="mb-1"><strong>Serial:</strong> {data.device.serial}</p>
                  ) : null}
                  {data.device.status ? (
                    <p className="mb-1"><strong>Status:</strong> {data.device.status}</p>
                  ) : null}
                  {(data.device.owner_name || data.device.owner_email || data.device.owner_phone) ? (
                    <div className="mt-3">
                      <h6 className="fw-semibold">Owner</h6>
                      <p className="mb-1"><strong>Name:</strong> {data.device.owner_name || 'N/A'}</p>
                      <p className="mb-1"><strong>Email:</strong> {data.device.owner_email || 'N/A'}</p>
                      <p className="mb-0"><strong>Phone:</strong> {data.device.owner_phone || 'N/A'}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-7">
              <div className="card mb-4">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <h5 className="card-title mb-0">Reports</h5>
                  </div>
                  {data.reports && data.reports.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {data.reports.map(r => (
                        <div key={r.id} className="list-group-item">
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <div className="fw-medium">#{r.id} • {r.type} • {r.status}</div>
                              {r.created_at && <div className="text-muted small">{new Date(r.created_at).toLocaleString()}</div>}
                            </div>
                            <div className="ms-3">
                              <Link to={`/reports/${r.id}`} className="btn btn-sm btn-outline-primary">Open</Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">No reports for this device.</p>
                  )}
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title">Transfers</h5>
                  {data.transfers && data.transfers.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {data.transfers.map(t => (
                        <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>#{t.id} • {t.status || 'status'} • {t.created_at ? new Date(t.created_at).toLocaleString() : ''}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">No transfer records.</p>
                  )}
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title">Check History</h5>
                  {data.check_history && data.check_history.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {data.check_history.map(ch => (
                        <li key={ch.id} className="list-group-item">
                          <div className="d-flex align-items-start">
                            <div className="flex-grow-1">
                              <div className="fw-medium">
                                {ch.check_result || 'result'} • {ch.query || 'query'}
                              </div>
                              <div className="text-muted small">
                                {(ch.location_address || ch.ip_address) ? `${ch.location_address || ''}${ch.location_address && ch.ip_address ? ' • ' : ''}${ch.ip_address || ''}` : ''}
                              </div>
                              {ch.checker_name || ch.checker_email ? (
                                <div className="text-muted small">
                                  {ch.checker_name || ''}{ch.checker_name && ch.checker_email ? ' • ' : ''}{ch.checker_email || ''}
                                </div>
                              ) : null}
                            </div>
                            <div className="ms-3 text-muted small">
                              {ch.created_at ? new Date(ch.created_at).toLocaleString() : ''}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">No check history.</p>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Activity</h5>
                  {data.activity_logs && data.activity_logs.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {data.activity_logs.map(a => (
                        <li key={a.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{a.action || 'Action'} • {a.actor || 'actor'}</span>
                          <span className="text-muted small">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">No activity logs.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}