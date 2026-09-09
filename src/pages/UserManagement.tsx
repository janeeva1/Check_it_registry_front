import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Filter, Edit3, Shield, MapPin, UserCheck, UserX, RefreshCw, Mail, Phone, Smartphone, FileText, X, Save, AlertTriangle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { getDisplayName, getUserInitials } from '../utils/userHelpers'

interface User {
  id: string
  name: string
  first_name?: string
  middle_name?: string
  last_name?: string
  email: string
  role: 'user' | 'business' | 'admin' | 'lea'
  region?: string
  phone?: string
  verified_at?: string
  created_at: string
  last_login_at?: string
  device_count: number
  report_count: number
  status: 'active' | 'suspended' | 'pending'
  avatar_url?: string
}

interface UserStats {
  total_users: number
  new_users_24h: number
  verified_users: number
  admin_users: number
  lea_users: number
  business_users: number
  regular_users: number
  suspended_users: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()
  const API_URL = import.meta.env.VITE_API_URL || '/api'
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [userDetails, setUserDetails] = useState<any | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; first_name?: string; middle_name?: string; last_name?: string; email: string; phone?: string; region?: string; role: User['role'] } | null>(null)
  const [savingEdits, setSavingEdits] = useState(false)
  const [showConfirmSave, setShowConfirmSave] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [resetUserId, setResetUserId] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUserData() }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) { showError('Not Authorized', 'Please log in as an admin'); return }

      const response = await fetch(`${API_URL}/user-management/users?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load users')
      const data = await response.json()
      const apiUsers = (data.users || []) as any[]
      const mappedUsers: User[] = apiUsers.map(u => ({
        id: u.id, name: u.name, first_name: u.first_name, middle_name: u.middle_name, last_name: u.last_name,
        email: u.email,
        role: (u.role || 'user') as User['role'],
        region: u.region || undefined, phone: u.phone || undefined,
        verified_at: u.verified_at || undefined, created_at: u.created_at,
        last_login_at: u.last_login_at || undefined,
        device_count: u.device_count || 0, report_count: u.report_count || 0,
        status: (u.status || 'active') as User['status'],
        avatar_url: u.avatar_url || undefined
      }))
      setUsers(mappedUsers)
      setStats({
        total_users: mappedUsers.length, new_users_24h: 0,
        verified_users: mappedUsers.filter(u => !!u.verified_at).length,
        admin_users: mappedUsers.filter(u => u.role === 'admin').length,
        lea_users: mappedUsers.filter(u => u.role === 'lea').length,
        business_users: mappedUsers.filter(u => u.role === 'business').length,
        regular_users: mappedUsers.filter(u => u.role === 'user').length,
        suspended_users: mappedUsers.filter(u => u.status === 'suspended').length
      })
    } catch (err) {
      showError('Loading Error', err instanceof Error ? err.message : 'Failed to load user management data')
    } finally {
      setLoading(false)
    }
  }

  const isOnline = (user: User) => {
    if (!user.last_login_at || user.status !== 'active') return false
    return Date.now() - new Date(user.last_login_at).getTime() < 30 * 60 * 1000
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = getDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const _handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setActionLoading(userId)
      const token = localStorage.getItem('auth_token')
      if (!token) { showError('Not Authorized', 'Please log in as an admin'); return }
      const response = await fetch(`${API_URL}/user-management/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      })
      if (!response.ok) throw new Error('Failed to update role')
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, role: newRole as any } : user))
      showSuccess('Role Updated', `User role has been updated to ${newRole}`)
      setShowUserModal(false)
    } catch (err) {
      showError('Update Failed', err instanceof Error ? err.message : 'Failed to update user role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      setActionLoading(userId)
      const token = localStorage.getItem('auth_token')
      if (!token) { showError('Not Authorized', 'Please log in as an admin'); return }
      const response = await fetch(`${API_URL}/user-management/users/${userId}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ suspended: suspend })
      })
      if (!response.ok) throw new Error('Failed to update user suspension')
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, status: suspend ? 'suspended' : 'active' } : user))
      showSuccess(suspend ? 'User Suspended' : 'User Activated', `User has been ${suspend ? 'suspended' : 'activated'} successfully`)
    } catch (err) {
      showError('Action Failed', err instanceof Error ? err.message : `Failed to ${suspend ? 'suspend' : 'activate'} user`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPassword = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) { showError('Not Authorized', 'Please log in as an admin'); return }
      setActionLoading(userId)
      const response = await fetch(`${API_URL}/user-management/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: 'welcome@proveownership', send_email: true })
      })
      if (response.ok) {
        showSuccess('Password Reset', 'Default password set to "welcome@proveownership"')
      } else {
        const err = await response.json().catch(() => ({}))
        showError('Reset Failed', err.error || 'Could not reset password')
      }
    } catch {
      showError('Reset Failed', 'Unexpected error occurred while resetting password')
    } finally {
      setActionLoading(null)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEditForm({ name: user.name, first_name: user.first_name, middle_name: user.middle_name, last_name: user.last_name, email: user.email, phone: user.phone, region: user.region, role: user.role })
    setShowUserModal(true)
  }

  const saveUserEdits = async () => {
    if (!selectedUser || !editForm) return
    const userId = selectedUser.id
    const token = localStorage.getItem('auth_token')
    if (!token) { showError('Not Authorized', 'Please log in as an admin'); return }
    try {
      setSavingEdits(true)
      if (selectedUser.role !== editForm.role) {
        const roleResp = await fetch(`${API_URL}/user-management/users/${userId}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role: editForm.role })
        })
        if (!roleResp.ok) throw new Error('Failed to update user role')
      }
      const generalChanges: any = {}
      ;(['name', 'email', 'phone', 'region'] as const).forEach(key => {
        if (selectedUser[key] !== editForm[key]) generalChanges[key] = editForm[key]
      })
      if (Object.keys(generalChanges).length > 0) {
        const resp = await fetch(`${API_URL}/user-management/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(generalChanges)
        })
        if (!resp.ok) throw new Error('Failed to save user details')
      }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: editForm.name || getDisplayName(editForm), first_name: editForm.first_name, middle_name: editForm.middle_name, last_name: editForm.last_name, email: editForm.email, phone: editForm.phone, region: editForm.region, role: editForm.role } : u))
      showSuccess('Saved', 'User information updated successfully')
      setShowUserModal(false)
    } catch (err) {
      showError('Save Failed', err instanceof Error ? err.message : 'Could not save changes')
    } finally {
      setSavingEdits(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'var(--danger-500)'
      case 'lea': return 'var(--warning-500)'
      case 'business': return 'var(--primary-500)'
      default: return 'var(--success-500)'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'lea': return 'Law Enforcement'
      case 'business': return 'Business'
      default: return 'Regular User'
    }
  }

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} role="status" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading user management...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1>User Management</h1>
                <p>Manage user accounts, roles, and permissions</p>
              </div>
              <div className="d-flex gap-2">
                <button onClick={loadUserData} className="btn-ghost" disabled={loading}>
                  <RefreshCw size={18} className={loading ? 'spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>

          {stats && (
            <motion.div variants={itemVariants} className="row g-4 mb-4">
              <div className="col-xl-3 col-md-6">
                <div className="stat-card">
                  <div className="stat-icon mb-3" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)' }}>
                    <Users size={24} />
                  </div>
                  <div className="stat-value">{stats.total_users.toLocaleString()}</div>
                  <div className="stat-label">Total Users</div>
                  <small style={{ color: 'var(--text-tertiary)' }}>+{stats.new_users_24h} today</small>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card">
                  <div className="stat-icon mb-3" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)' }}>
                    <UserCheck size={24} />
                  </div>
                  <div className="stat-value">{stats.verified_users.toLocaleString()}</div>
                  <div className="stat-label">Verified Users</div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card">
                  <div className="stat-icon mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)' }}>
                    <Shield size={24} />
                  </div>
                  <div className="stat-value">{stats.admin_users + stats.lea_users}</div>
                  <div className="stat-label">Admin & LEA</div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card">
                  <div className="stat-icon mb-3" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)' }}>
                    <UserX size={24} />
                  </div>
                  <div className="stat-value">{stats.suspended_users}</div>
                  <div className="stat-label">Suspended</div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label d-flex align-items-center gap-2">
                  <Search size={16} /> Search Users
                </label>
                <input type="text" className="modern-input" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label d-flex align-items-center gap-2">
                  <Filter size={16} /> Role
                </label>
                <select className="modern-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="user">Regular Users</option>
                  <option value="business">Business Users</option>
                  <option value="lea">Law Enforcement</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select className="modern-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="col-md-2">
                <button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all') }} className="btn-ghost w-100 text-center">
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card">
            <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
              <h3 className="h5 mb-0" style={{ color: 'var(--text-primary)' }}>Users ({filteredUsers.length})</h3>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Devices</th>
                    <th>Last Login</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.tr key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="position-relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={getDisplayName(user)} className="rounded-circle object-fit-cover" style={{ width: 40, height: 40, border: '2px solid var(--border-color)' }} />
                              ) : (
                                <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))' }}>
                                  {getUserInitials(user)}
                                </div>
                              )}
                              <span className="position-absolute rounded-circle" style={{ width: 10, height: 10, right: -1, bottom: -1, border: '2px solid var(--bg-primary)', backgroundColor: isOnline(user) ? 'var(--success-500)' : 'var(--gray-400)' }} />
                            </div>
                            <div>
                              <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{getDisplayName(user)}</div>
                              <small style={{ color: 'var(--text-tertiary)' }}>{user.email}</small>
                              {user.region && (
                                <div className="d-flex align-items-center gap-1 mt-1">
                                  <MapPin size={12} style={{ color: 'var(--text-tertiary)' }} />
                                  <small style={{ color: 'var(--text-tertiary)' }}>{user.region}</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: `${getRoleColor(user.role)}15`, color: getRoleColor(user.role), border: `1px solid ${getRoleColor(user.role)}30` }}>
                            {getRoleBadge(user.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.status === 'active' ? 'status-verified' : user.status === 'suspended' ? 'status-stolen' : 'status-unverified'}`}>
                            <span className="badge-dot" style={{ backgroundColor: user.status === 'active' ? 'var(--success-500)' : user.status === 'suspended' ? 'var(--danger-500)' : 'var(--warning-500)' }} />
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{user.device_count}</td>
                        <td>
                          <small style={{ color: 'var(--text-tertiary)' }}>
                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-end">
                            <button onClick={async () => {
                              setSelectedUser(user); setShowDetailsModal(true); setDetailsLoading(true)
                              try {
                                const token = localStorage.getItem('auth_token')
                                const response = await fetch(`${API_URL}/user-management/users/${user.id}`, {
                                  headers: { Authorization: `Bearer ${token || ''}` }
                                })
                                setUserDetails(await response.json())
                              } catch { showError('Load Failed', 'Could not fetch user details') }
                              finally { setDetailsLoading(false) }
                            }} className="btn-ghost" title="View Details">View</button>
                            <button onClick={() => openEditModal(user)} className="btn-ghost" title="Edit User"><Edit3 size={14} /></button>
                            <button onClick={() => handleSuspendUser(user.id, user.status !== 'suspended')} className="btn-ghost"
                              disabled={actionLoading === user.id}
                              title={user.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                              style={{ color: user.status === 'suspended' ? 'var(--success-500)' : 'var(--warning-500)' }}>
                              {actionLoading === user.id ? <div className="spinner-border spinner-border-sm" /> : user.status === 'suspended' ? <UserCheck size={14} /> : <UserX size={14} />}
                            </button>
                            <button onClick={() => { setResetUserId(user.id); setShowConfirmReset(true) }} className="btn-ghost"
                              disabled={actionLoading === user.id} title="Reset Password" style={{ color: 'var(--danger-500)' }}>
                              {actionLoading === user.id ? <div className="spinner-border spinner-border-sm" /> : <RefreshCw size={14} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><Users size={32} /></div>
                <h3>No users found</h3>
                <p>Try adjusting your search criteria or filters.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" style={{ maxWidth: 540, width: '90%' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h3>Edit User: {getDisplayName(selectedUser)}</h3>
                <button onClick={() => setShowUserModal(false)} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label">Name</label>
                    <input className="modern-input" value={editForm?.name || ''} onChange={(e) => editForm && setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input className="modern-input" value={editForm?.email || ''} onChange={(e) => editForm && setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input className="modern-input" value={editForm?.phone || ''} onChange={(e) => editForm && setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Region</label>
                    <input className="modern-input" value={editForm?.region || ''} onChange={(e) => editForm && setEditForm({ ...editForm, region: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Role</label>
                    <select className="modern-select" value={editForm?.role || 'user'}
                      onChange={(e) => editForm && setEditForm({ ...editForm, role: e.target.value as any })} disabled={savingEdits}>
                      <option value="user">Regular User</option>
                      <option value="business">Business User</option>
                      <option value="lea">Law Enforcement</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="alert-banner alert-banner-warning d-flex align-items-start gap-2">
                    <AlertTriangle size={16} className="mt-1 flex-shrink-0" />
                    <small>Changing user roles will affect their permissions and access levels.</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowUserModal(false)} className="btn-ghost">Cancel</button>
                <button onClick={() => setShowConfirmSave(true)} className="btn-gradient-primary" disabled={savingEdits}>
                  <Save size={18} />
                  {savingEdits ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedUser && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" style={{ maxWidth: 640, width: '90%' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                  <h3>User Details: {getDisplayName(selectedUser)}</h3>
                <button onClick={() => setShowDetailsModal(false)} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <div className="modal-body">
                {detailsLoading ? (
                  <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--primary-600)' }} /></div>
                ) : userDetails ? (
                  <div className="d-flex flex-column gap-4">
                    <div className="d-flex align-items-center gap-3 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))' }}>
                        {getUserInitials(userDetails?.user || selectedUser)}
                      </div>
                      <div>
                        <h4 className="mb-1" style={{ color: 'var(--text-primary)' }}>{getDisplayName(userDetails?.user || selectedUser)}</h4>
                        <span className="status-badge" style={{ backgroundColor: `${getRoleColor(userDetails.user.role)}15`, color: getRoleColor(userDetails.user.role), border: `1px solid ${getRoleColor(userDetails.user.role)}30` }}>
                          {getRoleBadge(userDetails.user.role)}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex align-items-center gap-3 py-2">
                        <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--primary-100)', color: 'var(--primary-600)' }}><Mail size={16} /></div>
                        <span style={{ color: 'var(--text-primary)' }}>{userDetails.user.email}</span>
                      </div>
                      <div className="d-flex align-items-center gap-3 py-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--primary-100)', color: 'var(--primary-600)' }}><Phone size={16} /></div>
                        <span style={{ color: 'var(--text-primary)' }}>{userDetails.user.phone || '\u2014'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-3 py-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--primary-100)', color: 'var(--primary-600)' }}><MapPin size={16} /></div>
                        <span style={{ color: 'var(--text-primary)' }}>{userDetails.user.region || '\u2014'}</span>
                      </div>
                    </div>
                    <div className="card-bordered p-3">
                      <h6 style={{ color: 'var(--text-tertiary)' }} className="mb-3">Devices ({userDetails.devices?.length || 0})</h6>
                      {userDetails.devices?.length > 0 ? userDetails.devices.map((d: any) => (
                        <div key={d.id} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                          <span><Smartphone size={14} className="me-2" style={{ color: 'var(--text-tertiary)' }} />{d.brand} {d.model} &middot; IMEI: {d.imei}</span>
                          <small style={{ color: 'var(--text-tertiary)' }}>{d.report_count || 0} reports</small>
                        </div>
                      )) : <small style={{ color: 'var(--text-tertiary)' }}>No devices</small>}
                    </div>
                    <div className="card-bordered p-3">
                      <h6 style={{ color: 'var(--text-tertiary)' }} className="mb-3">Reports ({userDetails.reports?.length || 0})</h6>
                      {userDetails.reports?.length > 0 ? userDetails.reports.map((r: any) => (
                        <div key={r.id} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                          <span><FileText size={14} className="me-2" style={{ color: 'var(--text-tertiary)' }} />Type: {r.report_type || r.type || r.status} &middot; {r.brand} {r.model}</span>
                          <small style={{ color: 'var(--text-tertiary)' }}>{new Date(r.created_at).toLocaleString()}</small>
                        </div>
                      )) : <small style={{ color: 'var(--text-tertiary)' }}>No reports</small>}
                    </div>
                  </div>
                ) : <p>No details found.</p>}
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowDetailsModal(false)} className="btn-ghost">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Reset Modal */}
      <AnimatePresence>
        {showConfirmReset && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ zIndex: 1060 }}>
            <motion.div className="modal-content" style={{ maxWidth: 420, width: '90%' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h3>Confirm Password Reset</h3>
                <button onClick={() => { setShowConfirmReset(false); setResetUserId(null) }} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-tertiary)' }}>
                  Are you sure you want to reset the password for <strong style={{ color: 'var(--text-primary)' }}>{getDisplayName(users.find(u => u.id === resetUserId)) || 'this user'}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button onClick={() => { setShowConfirmReset(false); setResetUserId(null) }} className="btn-ghost">Cancel</button>
                <button onClick={() => { if (resetUserId) handleResetPassword(resetUserId); setShowConfirmReset(false); setResetUserId(null) }}
                  className="btn-gradient-danger" disabled={actionLoading === resetUserId}>
                  {actionLoading === resetUserId ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Save Modal */}
      <AnimatePresence>
        {showConfirmSave && showUserModal && selectedUser && editForm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ zIndex: 1060 }}>
            <motion.div className="modal-content" style={{ maxWidth: 420, width: '90%' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h3>Confirm Save Changes</h3>
                <button onClick={() => setShowConfirmSave(false)} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-tertiary)' }}>Save updates for <strong style={{ color: 'var(--text-primary)' }}>{getDisplayName(selectedUser)}</strong>?</p>
                {(getDisplayName(editForm) !== getDisplayName(selectedUser) || editForm.email !== selectedUser.email || editForm.role !== selectedUser.role) && (
                  <ul className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                    {getDisplayName(editForm) !== getDisplayName(selectedUser) && <li>Name: {getDisplayName(selectedUser)} &rarr; {getDisplayName(editForm)}</li>}
                    {editForm.email !== selectedUser.email && <li>Email: {selectedUser.email} &rarr; {editForm.email}</li>}
                    {editForm.role !== selectedUser.role && <li>Role: {selectedUser.role} &rarr; {editForm.role}</li>}
                  </ul>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowConfirmSave(false)} className="btn-ghost">Cancel</button>
                <button onClick={async () => { setShowConfirmSave(false); await saveUserEdits() }} className="btn-gradient-primary" disabled={savingEdits}>
                  {savingEdits ? 'Saving...' : 'Confirm Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
