import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'

type LeaDeviceResponse = {
  device: any
  reports: any[]
  transfers: any[]
  verification_history: any[]
  activity_logs: any[]
}

export default function LEADeviceDetails() {
  const { id } = useParams()
  const [data, setData] = useState<LeaDeviceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/lea-portal/devices/${id}`)
        if (!res.ok) throw new Error(`Failed to load device: ${res.status}`)
        const json = await res.json()
        if (mounted) setData(json)
      } catch (err: any) {
        console.error('LEA device details error:', err)
        if (mounted) setError(err.message || 'Failed to load device details')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  return (
    <Layout requireAuth allowedRoles={["lea", "admin"]}>
      <div className="container py-3">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-3">
          <h1 className="h5 m-0">LEA Device Details</h1>
          <div className="d-flex gap-2">
            <Link to="/lea/cases" className="btn btn-outline-secondary btn-sm">Back to Cases</Link>
            {id && (
              <Link to={`/audit-trail?resource=device&q=${encodeURIComponent(id)}`} className="btn btn-outline-primary btn-sm">View Audit Logs</Link>
            )}
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div className="modern-card p-4">Loading device…</div>}

        {data && (
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="modern-card p-4">
                <h3 className="h6">Device</h3>
                <div className="mb-1"><strong>ID:</strong> {data.device?.id}</div>
                <div className="mb-1"><strong>Model:</strong> {data.device?.brand} {data.device?.model}</div>
                {data.device?.imei && (<div className="mb-1"><strong>IMEI:</strong> {data.device?.imei}</div>)}
                {data.device?.serial && (<div className="mb-1"><strong>Serial:</strong> {data.device?.serial}</div>)}
                <div className="mb-1"><strong>Owner:</strong> {data.device?.owner_name} ({data.device?.owner_email})</div>
                {data.device?.owner_region && (<div className="mb-0 text-secondary" style={{fontSize:13}}><strong>Region:</strong> {data.device?.owner_region}</div>)}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="modern-card p-4 mb-3">
                <h3 className="h6">Associated Reports</h3>
                {data.reports?.length ? (
                  <div className="list-group list-group-flush">
                    {data.reports.map((r: any) => (
                      <div key={r.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">#{r.case_id || r.id} • {r.report_type} • {r.status}</div>
                          <div className="text-secondary" style={{fontSize:13}}>
                            Reporter: {r.reporter_name || '—'} {r.created_at ? `• ${new Date(r.created_at).toLocaleString()}` : ''}
                          </div>
                        </div>
                        <div>
                          {r.case_id && (<Link to={`/lea/cases/${r.case_id}`} className="btn btn-sm btn-outline-primary">Open Case</Link>)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">No reports for this device.</div>
                )}
              </div>

              <div className="modern-card p-4 mb-3">
                <h3 className="h6">Transfer History</h3>
                {data.transfers?.length ? (
                  <ul className="list-group list-group-flush">
                    {data.transfers.map((t: any) => (
                      <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>#{t.id} • {t.status || 'status'} • {t.created_at ? new Date(t.created_at).toLocaleString() : ''}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-secondary">No transfer records.</div>
                )}
              </div>

              <div className="modern-card p-4">
                <h3 className="h6">Recent Activity</h3>
                {data.activity_logs?.length ? (
                  <ul className="list-group list-group-flush">
                    {data.activity_logs.map((a: any) => (
                      <li key={a.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{a.action || 'Action'} • {a.user_name || 'User'}</span>
                        <span className="text-secondary" style={{fontSize:13}}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-secondary">No audit records.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}