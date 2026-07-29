import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { Shield, Search, Filter, MapPin, Users, Plus } from 'lucide-react'

type Agency = {
  id: string; name: string; jurisdiction: string
  users: number; status: 'active' | 'suspended' | 'pending'
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminLEAManagement() {
  const agencies = useMemo<Agency[]>(() => ([
    { id: 'AG-001', name: 'Lagos Police Command', jurisdiction: 'Lagos State', users: 128, status: 'active' },
    { id: 'AG-002', name: 'Abuja Police HQ', jurisdiction: 'FCT Abuja', users: 94, status: 'active' },
    { id: 'AG-003', name: 'Kano Division', jurisdiction: 'Kano State', users: 37, status: 'pending' },
    { id: 'AG-004', name: 'Rivers Tactical Unit', jurisdiction: 'Rivers State', users: 52, status: 'suspended' },
  ]), [])

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all')

  const filtered = agencies.filter(a => (
    (filter === 'all' || a.status === filter) &&
    (a.name.toLowerCase().includes(query.toLowerCase()) || a.jurisdiction.toLowerCase().includes(query.toLowerCase()))
  ))

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1>LEA Management</h1>
                <p>Manage law enforcement agency access and settings</p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn-gradient-primary"><Plus size={18} /> Invite Agency</button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-6">
                <label className="form-label d-flex align-items-center gap-2"><Search size={16} /> Search Agencies</label>
                <input className="modern-input" placeholder="Search agencies by name or jurisdiction" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label d-flex align-items-center gap-2"><Filter size={16} /> Status</label>
                <select className="modern-select" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="col-md-3">
                <button onClick={() => { setQuery(''); setFilter('all') }} className="btn-ghost w-100 text-center">Clear Filters</button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card">
            <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
              <h3 className="h5 mb-0" style={{ color: 'var(--text-primary)' }}>Agencies ({filtered.length})</h3>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Agency</th>
                    <th>Jurisdiction</th>
                    <th>Users</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar" style={{ background: 'linear-gradient(135deg, #818cf8, #4f46e5)' }}>
                            <Shield size={16} />
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{a.name}</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>{a.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{a.jurisdiction}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{a.users}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${a.status === 'active' ? 'status-verified' : a.status === 'pending' ? 'status-unverified' : 'status-stolen'}`}>
                          <span className="badge-dot" style={{
                            backgroundColor: a.status === 'active' ? 'var(--success-500)' : a.status === 'pending' ? 'var(--warning-500)' : 'var(--danger-500)'
                          }} />
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn-ghost">View</button>
                          <button className="btn-ghost">Edit</button>
                          {a.status !== 'suspended' ? (
                            <button className="btn-ghost" style={{ color: 'var(--danger-500)' }}>Suspend</button>
                          ) : (
                            <button className="btn-ghost" style={{ color: 'var(--success-500)' }}>Activate</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state py-4">
                          <div className="empty-state-icon" style={{ width: 60, height: 60 }}><Shield size={24} /></div>
                          <h3 style={{ fontSize: 16 }}>No agencies match your filter</h3>
                          <p>Try adjusting your search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  )
}
