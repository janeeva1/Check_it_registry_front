import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { apiClient } from '../lib/apiClient'
import { Archive, Users, Smartphone, RotateCcw, Search, Download, Shield, ChevronRight, X, AlertTriangle, ExternalLink } from 'lucide-react'

type Tab = 'users' | 'devices' | 'stats' | 'exports'

export default function AdminArchive() {
  const navigate = useNavigate()
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState<Tab>('stats')
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState<any>(null)

  // Deleted users
  const [deletedUsers, setDeletedUsers] = useState<any[]>([])
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 0 })
  const [userSearch, setUserSearch] = useState('')

  // Deleted devices
  const [deletedDevices, setDeletedDevices] = useState<any[]>([])
  const [devicesPagination, setDevicesPagination] = useState({ page: 1, totalPages: 0 })
  const [deviceSearch, setDeviceSearch] = useState('')

  // Detail modal
  const [detail, setDetail] = useState<any>(null)
  const [detailType, setDetailType] = useState<'user' | 'device' | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Export audit
  const [exportLogs, setExportLogs] = useState<any[]>([])

  useEffect(() => { loadData() }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'stats') {
        const s = await apiClient.archive.stats()
        setStats(s)
      } else if (tab === 'users') {
        await loadDeletedUsers(1)
      } else if (tab === 'devices') {
        await loadDeletedDevices(1)
      } else if (tab === 'exports') {
        const r = await apiClient.archive.exportAudit()
        setExportLogs(r.logs || [])
      }
    } catch (err: any) { showError('Load failed', err.message) }
    finally { setLoading(false) }
  }

  const loadDeletedUsers = async (page: number) => {
    const r = await apiClient.archive.deletedUsers({ page, search: userSearch })
    setDeletedUsers(r.users || [])
    setUsersPagination(r.pagination || { page: 1, totalPages: 0 })
  }

  const loadDeletedDevices = async (page: number) => {
    const r = await apiClient.archive.deletedDevices({ page, search: deviceSearch })
    setDeletedDevices(r.devices || [])
    setDevicesPagination(r.pagination || { page: 1, totalPages: 0 })
  }

  const openDetail = async (type: 'user' | 'device', id: string) => {
    setDetailType(type)
    setDetailLoading(true)
    try {
      const d = type === 'user' ? await apiClient.archive.deletedUserDetail(id) : await apiClient.archive.deletedDeviceDetail(id)
      setDetail(d)
    } catch (err: any) { showError('Load failed', err.message) }
    finally { setDetailLoading(false) }
  }

  const handleRestore = async (type: 'user' | 'device', archiveId: string) => {
    if (!await confirm({ title: `Restore this ${type}?`, confirmLabel: 'Restore' })) return
    try {
      if (type === 'user') await apiClient.archive.restoreUser(archiveId)
      else await apiClient.archive.restoreDevice(archiveId)
      showSuccess('Restored', `${type} has been restored`)
      setDetail(null)
      loadData()
    } catch (err: any) { showError('Restore failed', err.message) }
  }

  const tabs = [
    { key: 'stats' as Tab, label: 'Overview', icon: Shield },
    { key: 'users' as Tab, label: 'Deleted Users', icon: Users },
    { key: 'devices' as Tab, label: 'Deleted Devices', icon: Smartphone },
    { key: 'exports' as Tab, label: 'Export Audit', icon: Download },
  ]

  return (
    <Layout requireAuth allowedRoles={['admin']}>
      <div className="container-fluid px-0">
        <div className="page-header">
          <div className="d-flex align-items-center gap-3">
            <Archive size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h1>Archive & Deleted Records</h1>
              <p className="text-secondary mb-0">Manage deleted accounts, devices, and data exports</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`btn btn-sm d-flex align-items-center gap-2 ${tab === t.key ? 'btn-primary' : 'btn-outline-secondary'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }} /></div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === 'stats' && stats && (
              <div className="row g-4">
                {[
                  { label: 'Active Users', value: stats.activeUsers, color: 'var(--success-500)' },
                  { label: 'Deleted Users', value: stats.deletedUsers, color: '#EF4444' },
                  { label: 'Restored Users', value: stats.restoredUsers, color: 'var(--primary)' },
                  { label: 'Active Devices', value: stats.activeDevices, color: 'var(--success-500)' },
                  { label: 'Deleted Devices', value: stats.deletedDevices, color: '#EF4444' },
                  { label: 'Restored Devices', value: stats.restoredDevices, color: 'var(--primary)' },
                  { label: 'Data Exports (30d)', value: stats.recentExports, color: 'var(--warning-500)' },
                  { label: 'Total Exports', value: stats.totalExports, color: '#6366f1' },
                ].map((s, i) => (
                  <div key={i} className="col-6 col-lg-3">
                    <div className="stat-card p-3">
                      <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DELETED USERS */}
            {tab === 'users' && (
              <div className="modern-card">
                <div className="p-3 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
                  <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                    <Search size={16} className="flex-shrink-0" />
                    <input type="text" placeholder="Search by email or name..." value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loadDeletedUsers(1)}
                      className="form-control form-control-sm" style={{ maxWidth: 300 }} />
                  </div>
                  <button onClick={() => loadDeletedUsers(1)} className="btn btn-sm btn-outline-primary flex-shrink-0">Search</button>
                </div>
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr><th>User</th><th>Email</th><th>Role</th><th>Deleted</th><th>Reason</th><th className="text-end">Actions</th></tr>
                    </thead>
                    <tbody>
                      {deletedUsers.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-4 text-secondary">No deleted users found</td></tr>
                      ) : deletedUsers.map(u => (
                        <tr key={u.id}>
                          <td className="fw-medium">{u.original_name || u.name}</td>
                          <td style={{ fontSize: 12 }}>{u.original_email}</td>
                          <td><span className="status-badge" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                          <td style={{ fontSize: 12 }}>{new Date(u.deleted_at).toLocaleDateString()}</td>
                          <td style={{ fontSize: 12, maxWidth: 200 }} className="text-truncate">{u.deletion_reason || 'N/A'}</td>
                          <td className="text-end">
                            <button onClick={() => openDetail('user', u.id)} className="btn btn-sm btn-outline-primary">
                              <ChevronRight size={14} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {usersPagination.totalPages > 1 && (
                  <div className="d-flex justify-content-center gap-2 p-3">
                    <button onClick={() => loadDeletedUsers(usersPagination.page - 1)} disabled={usersPagination.page <= 1} className="btn btn-sm btn-outline-secondary">Prev</button>
                    <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>Page {usersPagination.page} of {usersPagination.totalPages}</span>
                    <button onClick={() => loadDeletedUsers(usersPagination.page + 1)} disabled={usersPagination.page >= usersPagination.totalPages} className="btn btn-sm btn-outline-secondary">Next</button>
                  </div>
                )}
              </div>
            )}

            {/* DELETED DEVICES */}
            {tab === 'devices' && (
              <div className="modern-card">
                <div className="p-3 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
                  <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                    <Search size={16} className="flex-shrink-0" />
                    <input type="text" placeholder="Search by IMEI, serial, brand..." value={deviceSearch}
                      onChange={e => setDeviceSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loadDeletedDevices(1)}
                      className="form-control form-control-sm" style={{ maxWidth: 300 }} />
                  </div>
                  <button onClick={() => loadDeletedDevices(1)} className="btn btn-sm btn-outline-primary flex-shrink-0">Search</button>
                </div>
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr><th>Device</th><th>IMEI/Serial</th><th>Owner</th><th>Deleted</th><th>Reason</th><th className="text-end">Actions</th></tr>
                    </thead>
                    <tbody>
                      {deletedDevices.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-4 text-secondary">No deleted devices found</td></tr>
                      ) : deletedDevices.map(d => (
                        <tr key={d.id}>
                          <td className="fw-medium">{d.brand} {d.model}</td>
                          <td style={{ fontSize: 12 }}>{d.original_imei || d.original_serial || 'N/A'}</td>
                          <td style={{ fontSize: 12 }}>{d.owner_name || d.owner_email || 'Unknown'}</td>
                          <td style={{ fontSize: 12 }}>{new Date(d.deleted_at).toLocaleDateString()}</td>
                          <td style={{ fontSize: 12, maxWidth: 200 }} className="text-truncate">{d.deletion_reason || 'N/A'}</td>
                          <td className="text-end">
                            <button onClick={() => openDetail('device', d.id)} className="btn btn-sm btn-outline-primary">
                              <ChevronRight size={14} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {devicesPagination.totalPages > 1 && (
                  <div className="d-flex justify-content-center gap-2 p-3">
                    <button onClick={() => loadDeletedDevices(devicesPagination.page - 1)} disabled={devicesPagination.page <= 1} className="btn btn-sm btn-outline-secondary">Prev</button>
                    <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>Page {devicesPagination.page} of {devicesPagination.totalPages}</span>
                    <button onClick={() => loadDeletedDevices(devicesPagination.page + 1)} disabled={devicesPagination.page >= devicesPagination.totalPages} className="btn btn-sm btn-outline-secondary">Next</button>
                  </div>
                )}
              </div>
            )}

            {/* EXPORT AUDIT */}
            {tab === 'exports' && (
              <div className="modern-card">
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr><th>User</th><th>Type</th><th>Status</th><th>Requested</th><th>Completed</th></tr>
                    </thead>
                    <tbody>
                      {exportLogs.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-4 text-secondary">No export records found</td></tr>
                      ) : exportLogs.map(e => (
                        <tr key={e.id}>
                          <td>{e.user_name || e.original_email || e.user_id}</td>
                          <td><span className="status-badge" style={{ textTransform: 'capitalize' }}>{e.export_type}</span></td>
                          <td><span className={`status-badge ${e.status === 'completed' ? 'status-verified' : 'status-pending'}`}>{e.status}</span></td>
                          <td style={{ fontSize: 12 }}>{new Date(e.requested_at).toLocaleString()}</td>
                          <td style={{ fontSize: 12 }}>{e.completed_at ? new Date(e.completed_at).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* DETAIL MODAL */}
        {detail && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modern-card p-4" style={{ maxWidth: 700, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0">{detailType === 'user' ? 'Deleted User Detail' : 'Deleted Device Detail'}</h5>
                <button onClick={() => setDetail(null)} className="btn btn-sm btn-ghost"><X size={18} /></button>
              </div>
              {detailLoading ? (
                <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /></div>
              ) : detailType === 'user' ? (
                <div>
                  {detail.archive && (
                    <div className="mb-3 p-3 rounded-3" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="row g-2">
                        <div className="col-6"><strong>Email:</strong> {detail.archive.original_email}</div>
                        <div className="col-6"><strong>Name:</strong> {detail.archive.original_name}</div>
                        <div className="col-6"><strong>Role:</strong> {detail.archive.role}</div>
                        <div className="col-6"><strong>Deleted:</strong> {new Date(detail.archive.deleted_at).toLocaleString()}</div>
                        <div className="col-12"><strong>Reason:</strong> {detail.archive.deletion_reason || 'N/A'}</div>
                        <div className="col-6"><strong>Security Verified:</strong> {detail.archive.security_question_verified ? 'Yes' : 'No'}</div>
                        <div className="col-6"><strong>OTP Verified:</strong> {detail.archive.otp_verified ? 'Yes' : 'No'}</div>
                        <div className="col-4"><strong>Devices:</strong> {detail.archive.device_count}</div>
                        <div className="col-4"><strong>Reports:</strong> {detail.archive.report_count}</div>
                        <div className="col-4"><strong>Transfers:</strong> {detail.archive.transfer_count}</div>
                      </div>
                    </div>
                  )}
                  {detail.archive?.status === 'deleted' && (
                    <button onClick={() => handleRestore('user', detail.archive.id)} className="btn btn-sm btn-success d-flex align-items-center gap-2 mb-3">
                      <RotateCcw size={14} /> Restore Account
                    </button>
                  )}
                  {detail.user && (
                    <div className="mb-3">
                      <h6>Current Record Status</h6>
                      <p style={{ fontSize: 13 }}>Email: {detail.user.email} | Name: {detail.user.name} | Deleted: {detail.user.deleted_at ? 'Yes' : 'No'}</p>
                      <button onClick={() => navigate(`/admin/user/${detail.user.id}`)}
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2">
                        <ExternalLink size={14} /> View Full Profile
                      </button>
                    </div>
                  )}
                  {detail.devices?.length > 0 && (
                    <div className="mb-3">
                      <h6>Devices ({detail.devices.length})</h6>
                      <div className="table-responsive">
                        <table className="table table-sm" style={{ fontSize: 12 }}>
                          <thead><tr><th>Brand</th><th>Model</th><th>Status</th></tr></thead>
                          <tbody>{detail.devices.map((d: any) => <tr key={d.id}><td>{d.brand}</td><td>{d.model}</td><td>{d.status}</td></tr>)}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {detail.audit?.length > 0 && (
                    <div>
                      <h6>Activity Log ({detail.audit.length})</h6>
                      <div style={{ maxHeight: 200, overflowX: 'hidden', overflowY: 'auto' }}>
                        {detail.audit.map((a: any) => (
                          <div key={a.id} className="d-flex flex-wrap gap-2 py-1 border-bottom" style={{ fontSize: 11 }}>
                            <span className="text-secondary">{new Date(a.created_at).toLocaleString()}</span>
                            <span className="fw-medium">{a.action}</span>
                            <span className="text-secondary">{a.table_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {detail.archive && (
                    <div className="mb-3 p-3 rounded-3" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="row g-2">
                        <div className="col-6"><strong>Device:</strong> {detail.archive.brand} {detail.archive.model}</div>
                        <div className="col-6"><strong>Category:</strong> {detail.archive.category}</div>
                        <div className="col-6"><strong>IMEI:</strong> {detail.archive.original_imei || 'N/A'}</div>
                        <div className="col-6"><strong>Serial:</strong> {detail.archive.original_serial || 'N/A'}</div>
                        <div className="col-6"><strong>Deleted:</strong> {new Date(detail.archive.deleted_at).toLocaleString()}</div>
                        <div className="col-6"><strong>Status Before:</strong> {detail.archive.status_before_delete}</div>
                        <div className="col-12"><strong>Reason:</strong> {detail.archive.deletion_reason || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  {detail.archive?.status === 'deleted' && (
                    <button onClick={() => handleRestore('device', detail.archive.id)} className="btn btn-sm btn-success d-flex align-items-center gap-2 mb-3">
                      <RotateCcw size={14} /> Restore Device
                    </button>
                  )}
                  {detail.history?.length > 0 && (
                    <div>
                      <h6>Ownership History</h6>
                      <div style={{ maxHeight: 200, overflowX: 'hidden', overflowY: 'auto' }}>
                        {detail.history.map((h: any) => (
                          <div key={h.id} className="d-flex flex-wrap gap-2 py-1 border-bottom" style={{ fontSize: 11 }}>
                            <span className="text-secondary">{new Date(h.created_at).toLocaleString()}</span>
                            <span className="fw-medium">{h.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
