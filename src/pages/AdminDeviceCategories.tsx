import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'
import { Plus, Trash2, Edit3, Tag, X, Save, RefreshCw } from 'lucide-react'

type Category = { id: string; key: string; name: string; description?: string }

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminDeviceCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const { showSuccess, showError, toasts, removeToast } = useToast()

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await apiClient.devices.categories()
      const list = Array.isArray(data) ? data : []
      setCategories(list.map((c: any) => ({ id: c.key || c.id, key: c.key, name: c.label || c.name, description: c.description })))
    } catch (err: any) {
      showError('Failed to load categories', err.message || String(err))
    } finally { setLoading(false) }
  }

  useEffect(() => { loadCategories() }, [])

  const addCategory = async () => {
    const n = name.trim()
    if (!n) return showError('Category name is required')
    try {
      await apiClient.devices.createCategory({ name: n, description: description.trim() })
      setName(''); setDescription('')
      showSuccess('Category added')
      await loadCategories()
    } catch (err: any) {
      showError('Failed to add category', err.message || String(err))
    }
  }

  const removeCategory = async (id: string) => {
    try {
      await apiClient.devices.deleteCategory(id)
      showSuccess('Category removed')
      await loadCategories()
    } catch (err: any) {
      showError('Failed to remove category', err.message || String(err))
    }
  }

  const startEdit = (c: Category) => {
    setEditingId(c.id)
    setEditName(c.name)
    setEditDesc(c.description || '')
  }

  const saveEdit = async () => {
    if (!editName.trim() || !editingId) return
    try {
      await apiClient.devices.updateCategory(editingId, { name: editName.trim(), description: editDesc.trim() })
      setEditingId(null)
      showSuccess('Category updated')
      await loadCategories()
    } catch (err: any) {
      showError('Failed to update category', err.message || String(err))
    }
  }

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1>Device Categories</h1>
                <p>Manage device categories for classification</p>
              </div>
              <button onClick={loadCategories} className="btn-ghost"><RefreshCw size={16} /> Refresh</button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <h3 className="section-title"><Plus size={18} /> Add New Category</h3>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}><span style={{ color: 'red' }}>*</span> Required fields</div>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Category Name <span style={{ color: 'red' }}>*</span></label>
                <input className="modern-input" placeholder="e.g. Apple" value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Description <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span></label>
                <input className="modern-input" placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()} />
              </div>
              <div className="col-md-2">
                <button className="btn-gradient-primary w-100" onClick={addCategory}>
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          </motion.div>

          <div className="row g-3">
            <AnimatePresence>
              {loading ? (
                <div className="col-12 text-center py-5">
                  <div className="spinner-border" style={{ color: 'var(--primary-600)' }} />
                </div>
              ) : categories.map((c, i) => (
                <motion.div key={c.id} variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} transition={{ delay: i * 0.05 }}
                  className="col-12 col-md-6 col-lg-4">
                  <div className="modern-card p-4 d-flex flex-column gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon" style={{ width: 40, height: 40, background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                        <Tag size={20} />
                      </div>
                      <div className="flex-grow-1">
                        {editingId === c.id ? (
                          <div className="d-flex flex-column gap-2">
                            <input className="modern-input" value={editName} onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus style={{ padding: '6px 10px', fontSize: 14 }} />
                            <input className="modern-input" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveEdit()} placeholder="Description" style={{ padding: '6px 10px', fontSize: 14 }} />
                            <div className="d-flex gap-1">
                              <button className="btn-ghost" style={{ color: 'var(--success-500)' }} onClick={saveEdit}><Save size={16} /></button>
                              <button className="btn-ghost" onClick={() => setEditingId(null)}><X size={16} /></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>{c.key}</small>
                            {c.description && <small style={{ color: 'var(--text-secondary)', display: 'block' }}>{c.description}</small>}
                          </>
                        )}
                      </div>
                    </div>
                    {editingId !== c.id && (
                      <div className="d-flex gap-2">
                        <button className="btn-ghost d-flex align-items-center gap-1" onClick={() => startEdit(c)}>
                          <Edit3 size={14} /> Edit
                        </button>
                        <button className="btn-ghost d-flex align-items-center gap-1" style={{ color: 'var(--danger-500)' }} onClick={() => removeCategory(c.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!loading && categories.length === 0 && (
              <motion.div variants={itemVariants} className="col-12">
                <div className="empty-state">
                  <div className="empty-state-icon"><Tag size={32} /></div>
                  <h3>No categories yet</h3>
                  <p>Add your first device category above.</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
