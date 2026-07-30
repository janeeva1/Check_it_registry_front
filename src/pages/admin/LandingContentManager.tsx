import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, Save, X, Image as ImageIcon, MessageSquare, Users, Layout as LayoutIcon } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { useToast } from '../../components/Toast'

interface ContentItem {
  id: number; type: 'team' | 'testimonial'; name: string; role: string
  image_url: string; content: string; display_order: number; active: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function LandingContentManager() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'team' | 'testimonial'>('team')
  const { showSuccess, showError } = useToast()

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
  const API_URL_BASE = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')
  const API_URL = `${API_URL_BASE}/landing-content`
  const token = localStorage.getItem('auth_token')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchContent() }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/all`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      } else { showError('Error', 'Failed to fetch content') }
    } catch { showError('Error', 'Failed to load content') }
    finally { setLoading(false) }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      const isNew = !editingItem.id
      const url = isNew ? API_URL : `${API_URL}/${editingItem.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingItem)
      })
      if (res.ok) {
        showSuccess('Success', `Content ${isNew ? 'added' : 'updated'} successfully`)
        setIsModalOpen(false)
        fetchContent()
      } else { showError('Error', 'Failed to save content') }
    } catch { showError('Error', 'An error occurred while saving') }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        showSuccess('Success', 'Content deleted successfully')
        fetchContent()
      } else { showError('Error', 'Failed to delete content') }
    } catch { showError('Error', 'An error occurred while deleting') }
  }

  const openModal = (item?: ContentItem) => {
    if (item) { setEditingItem(item) }
    else {
      setEditingItem({ id: 0, type: activeTab, name: '', role: '', image_url: '', content: '', display_order: 0, active: true })
    }
    setIsModalOpen(true)
  }

  const filteredItems = (items || []).filter(item => item.type === activeTab)

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} role="status" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading content...</p>
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
                <h1>Landing Page Content</h1>
                <p>Manage team members and testimonials</p>
              </div>
              <button onClick={() => openModal()} className="btn-gradient-primary">
                <Plus size={18} />
                Add New {activeTab === 'team' ? 'Member' : 'Testimonial'}
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card mb-4">
            <div className="p-3 d-flex gap-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <button className={`btn-ghost d-flex align-items-center gap-2 ${activeTab === 'team' ? 'btn-gradient-primary' : ''}`}
                onClick={() => setActiveTab('team')}>
                <Users size={18} /> Team Members
              </button>
              <button className={`btn-ghost d-flex align-items-center gap-2 ${activeTab === 'testimonial' ? 'btn-gradient-primary' : ''}`}
                onClick={() => setActiveTab('testimonial')}>
                <MessageSquare size={18} /> Testimonials
              </button>
            </div>

            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name / Role</th>
                    <th>Content</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="rounded-circle object-fit-cover" style={{ width: 40, height: 40 }} />
                          ) : (
                            <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))' }}>
                              <ImageIcon size={16} />
                            </div>
                          )}
                          <div>
                            <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>{item.role}</small>
                          </div>
                        </div>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <div className="text-truncate" title={item.content} style={{ color: 'var(--text-primary)' }}>{item.content}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${item.active ? 'status-verified' : 'status-inactive'}`}>
                          <span className="badge-dot" style={{ backgroundColor: item.active ? 'var(--success-500)' : 'var(--gray-500)' }} />
                          {item.active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>{item.display_order}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <button onClick={() => openModal(item)} className="btn-ghost"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(item.id)} className="btn-ghost" style={{ color: 'var(--danger-500)' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><LayoutIcon size={32} /></div>
                        <h3>No content found</h3>
                        <p>Add some items to get started.</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && editingItem && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" style={{ maxWidth: 600 }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <form onSubmit={handleSave}>
                <div className="modal-header">
                  <h3>{editingItem.id ? 'Edit' : 'Add'} {activeTab === 'team' ? 'Team Member' : 'Testimonial'}</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost p-1"><X size={20} /></button>
                </div>
                <div className="modal-body">
                  <div style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:12}}><span style={{color:'red'}}>*</span> Required fields</div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Name <span style={{color:'red'}}>*</span></label>
                      <input type="text" className="modern-input" required value={editingItem.name}
                        onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Role / Title <span style={{color:'red'}}>*</span></label>
                      <input type="text" className="modern-input" required value={editingItem.role}
                        onChange={e => setEditingItem({ ...editingItem, role: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Image URL <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                      <input type="url" className="modern-input" placeholder="https://..." value={editingItem.image_url || ''}
                        onChange={e => setEditingItem({ ...editingItem, image_url: e.target.value })} />
                      {editingItem.image_url && (
                        <div className="mt-2">
                          <img src={editingItem.image_url} alt="Preview" className="rounded border" style={{ height: 60 }}
                            onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">{activeTab === 'team' ? 'Bio / Description' : 'Quote / Content'} <span style={{color:'red'}}>*</span></label>
                      <textarea className="modern-textarea" rows={4} required value={editingItem.content}
                        onChange={e => setEditingItem({ ...editingItem, content: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Display Order <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                      <input type="number" className="modern-input" value={editingItem.display_order}
                        onChange={e => setEditingItem({ ...editingItem, display_order: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="col-md-6 d-flex align-items-end pb-2">
                      <div className="form-check form-switch mb-0 d-flex align-items-center gap-3">
                        <input className="form-check-input" type="checkbox" checked={editingItem.active}
                          onChange={e => setEditingItem({ ...editingItem, active: e.target.checked })}
                          style={{ cursor: 'pointer', width: 44, height: 22 }} />
                        <label className="form-check-label" style={{ color: 'var(--text-primary)' }}>Active (Visible)</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-gradient-primary"><Save size={18} /> Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
