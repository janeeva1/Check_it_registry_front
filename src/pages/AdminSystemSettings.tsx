import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { Settings, Shield, Bell, Smartphone, Globe, Clock, Save, RefreshCw, Lock, Key, Users, DollarSign, TrendingUp } from 'lucide-react'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminSystemSettings() {
  const [featureFlags, setFeatureFlags] = useState({
    marketplace: true, leaPortal: true, emailNotifications: true,
    smsNotifications: false, publicCheck: true, bulkRegistration: false,
    autoVerification: false
  })
  const [security, setSecurity] = useState({
    require2FA: true, sessionTimeout: 30, allowPasswordless: false,
    maxLoginAttempts: 5, passwordMinLength: 8
  })
  const [saving, setSaving] = useState(false)
  const [platformFee, setPlatformFee] = useState('2.50')
  const [loadingFee, setLoadingFee] = useState(true)

  const { toasts, removeToast, showSuccess, showError } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const API_URL = import.meta.env.VITE_API_URL || '/api'

        const feeRes = await fetch(`${API_URL}/escrow/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (feeRes.ok) {
          const feeData = await feeRes.json()
          if (feeData.platformFeePercent) setPlatformFee(String(feeData.platformFeePercent))
        }

        const sysRes = await fetch(`${API_URL}/admin-system/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (sysRes.ok) {
          const sysData = await sysRes.json()
          const s = sysData.settings || {}
          setFeatureFlags({
            marketplace: s.feature_marketplace !== undefined ? Boolean(s.feature_marketplace) : true,
            leaPortal: s.feature_lea_portal !== undefined ? Boolean(s.feature_lea_portal) : true,
            emailNotifications: s.feature_email_notifications !== undefined ? Boolean(s.feature_email_notifications) : true,
            smsNotifications: s.feature_sms_notifications !== undefined ? Boolean(s.feature_sms_notifications) : false,
            publicCheck: s.feature_public_check !== undefined ? Boolean(s.feature_public_check) : true,
            bulkRegistration: s.feature_bulk_registration !== undefined ? Boolean(s.feature_bulk_registration) : false,
            autoVerification: s.feature_auto_verification !== undefined ? Boolean(s.feature_auto_verification) : false,
          })
          setSecurity({
            require2FA: s.security_require_2fa !== undefined ? Boolean(s.security_require_2fa) : true,
            sessionTimeout: s.security_session_timeout || 30,
            allowPasswordless: s.security_passwordless !== undefined ? Boolean(s.security_passwordless) : false,
            maxLoginAttempts: s.security_max_login_attempts || 5,
            passwordMinLength: s.security_password_min_length || 8,
          })
        }
      } catch { /* use defaults */ } finally { setLoadingFee(false) }
    }
    fetchSettings()
  }, [])

  const updateFlag = (k: keyof typeof featureFlags) =>
    setFeatureFlags(prev => ({ ...prev, [k]: !prev[k] }))

  const onSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const API_URL = import.meta.env.VITE_API_URL || '/api'

      const feeNum = parseFloat(platformFee)
      if (isNaN(feeNum) || feeNum < 0 || feeNum > 100) throw new Error('Fee must be between 0 and 100')

      const feeRes = await fetch(`${API_URL}/escrow/admin/settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform_fee_percent: feeNum })
      })
      if (!feeRes.ok) { const d = await feeRes.json(); throw new Error(d.error || 'Save failed') }

      const sysSettings: Record<string, any> = {
        feature_marketplace: featureFlags.marketplace,
        feature_lea_portal: featureFlags.leaPortal,
        feature_email_notifications: featureFlags.emailNotifications,
        feature_sms_notifications: featureFlags.smsNotifications,
        feature_public_check: featureFlags.publicCheck,
        feature_bulk_registration: featureFlags.bulkRegistration,
        feature_auto_verification: featureFlags.autoVerification,
        security_require_2fa: security.require2FA,
        security_session_timeout: security.sessionTimeout,
        security_passwordless: security.allowPasswordless,
        security_max_login_attempts: security.maxLoginAttempts,
        security_password_min_length: security.passwordMinLength,
      }

      const sysRes = await fetch(`${API_URL}/admin-system/settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: sysSettings })
      })
      if (!sysRes.ok) { const d = await sysRes.json(); throw new Error(d.error || 'Save failed') }

      showSuccess('Settings saved successfully')
    } catch (err: any) {
      showError(err.message)
    } finally { setSaving(false) }
  }

  const FlagToggle = ({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: () => void; icon: React.ReactNode }) => (
    <div className="d-flex justify-content-between align-items-center py-3 px-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="d-flex align-items-center gap-3">
        <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{icon}</div>
        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
      </div>
      <div className="form-check form-switch mb-0">
        <input className="form-check-input" type="checkbox" checked={checked} onChange={onChange}
          style={{ cursor: 'pointer', width: 44, height: 22 }} />
      </div>
    </div>
  )

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1>System Settings</h1>
                <p>Configure platform features, security, and preferences</p>
              </div>
              <button onClick={onSave} className="btn-gradient-primary" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>

          <div className="row g-4">
            <motion.div variants={itemVariants} className="col-lg-6">
              <div className="modern-card">
                <div className="p-4 border-bottom d-flex align-items-center gap-3" style={{ borderBottomColor: 'var(--border-color)' }}>
                  <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)' }}>
                    <Settings size={22} />
                  </div>
                  <div>
                    <h3 className="h5 mb-1" style={{ color: 'var(--text-primary)' }}>Feature Flags</h3>
                    <small style={{ color: 'var(--text-tertiary)' }}>Enable or disable platform features</small>
                  </div>
                </div>
                <div className="p-2">
                  <FlagToggle label="Marketplace" checked={featureFlags.marketplace} onChange={() => updateFlag('marketplace')} icon={<Smartphone size={16} />} />
                  <FlagToggle label="LEA Portal" checked={featureFlags.leaPortal} onChange={() => updateFlag('leaPortal')} icon={<Shield size={16} />} />
                  <FlagToggle label="Email Notifications" checked={featureFlags.emailNotifications} onChange={() => updateFlag('emailNotifications')} icon={<Bell size={16} />} />
                  <FlagToggle label="SMS Notifications" checked={featureFlags.smsNotifications} onChange={() => updateFlag('smsNotifications')} icon={<Bell size={16} />} />
                  <FlagToggle label="Public Device Check" checked={featureFlags.publicCheck} onChange={() => updateFlag('publicCheck')} icon={<Globe size={16} />} />
                  <FlagToggle label="Bulk Registration" checked={featureFlags.bulkRegistration} onChange={() => updateFlag('bulkRegistration')} icon={<Users size={16} />} />
                  <FlagToggle label="Auto Verification" checked={featureFlags.autoVerification} onChange={() => updateFlag('autoVerification')} icon={<Smartphone size={16} />} />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="col-lg-6">
              <div className="modern-card">
                <div className="p-4 border-bottom d-flex align-items-center gap-3" style={{ borderBottomColor: 'var(--border-color)' }}>
                  <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                    <Lock size={22} />
                  </div>
                  <div>
                    <h3 className="h5 mb-1" style={{ color: 'var(--text-primary)' }}>Security</h3>
                    <small style={{ color: 'var(--text-tertiary)' }}>Authentication and security settings</small>
                  </div>
                </div>
                <div className="p-4 d-flex flex-column gap-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <Key size={16} />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)' }}>Require 2FA for Admins</div>
                        <small style={{ color: 'var(--text-tertiary)' }}>Extra layer of security</small>
                      </div>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input className="form-check-input" type="checkbox" checked={security.require2FA}
                        onChange={(e) => setSecurity(prev => ({ ...prev, require2FA: e.target.checked }))}
                        style={{ cursor: 'pointer', width: 44, height: 22 }} />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)' }}>Session Timeout</div>
                        <small style={{ color: 'var(--text-tertiary)' }}>Minutes before auto-logout</small>
                      </div>
                    </div>
                    <input type="number" className="modern-input" style={{ maxWidth: 100, padding: '8px 12px' }}
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))} />
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <Key size={16} />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)' }}>Passwordless Login</div>
                        <small style={{ color: 'var(--text-tertiary)' }}>Email-based magic links</small>
                      </div>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input className="form-check-input" type="checkbox" checked={security.allowPasswordless}
                        onChange={(e) => setSecurity(prev => ({ ...prev, allowPasswordless: e.target.checked }))}
                        style={{ cursor: 'pointer', width: 44, height: 22 }} />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <Shield size={16} />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)' }}>Max Login Attempts</div>
                        <small style={{ color: 'var(--text-tertiary)' }}>Before temporary lockout</small>
                      </div>
                    </div>
                    <input type="number" className="modern-input" style={{ maxWidth: 100, padding: '8px 12px' }}
                      value={security.maxLoginAttempts}
                      onChange={(e) => setSecurity(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))} />
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon" style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <Lock size={16} />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)' }}>Min Password Length</div>
                        <small style={{ color: 'var(--text-tertiary)' }}>Characters required</small>
                      </div>
                    </div>
                    <input type="number" className="modern-input" style={{ maxWidth: 100, padding: '8px 12px' }}
                      value={security.passwordMinLength}
                      onChange={(e) => setSecurity(prev => ({ ...prev, passwordMinLength: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              <motion.div variants={itemVariants} className="modern-card mt-4">
                <div className="p-4 border-bottom d-flex align-items-center gap-3" style={{ borderBottomColor: 'var(--border-color)' }}>
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-500)' }}>
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <h3 className="h5 mb-1" style={{ color: 'var(--text-primary)' }}>Platform Fee</h3>
                    <small style={{ color: 'var(--text-tertiary)' }}>Escrow fee charged on marketplace sales</small>
                  </div>
                </div>
                <div className="p-4">
                  <label className="d-block mb-2" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>
                    Fee Percentage <TrendingUp size={14} style={{ color: 'var(--text-secondary)' }} />
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <input type="number" step="0.01" min="0" max="100" className="modern-input" style={{ maxWidth: 140, padding: '10px 14px', fontSize: 18, fontWeight: 600 }}
                      value={platformFee}
                      onChange={e => setPlatformFee(e.target.value)}
                      disabled={loadingFee} />
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>%</span>
                    {loadingFee && <div className="spinner-border spinner-border-sm" />}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                    This fee is deducted from the seller's payout when a buyer confirms delivery.
                    For example, a 2.5% fee on a ₦100,000 sale deducts ₦2,500 (seller receives ₦97,500).
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="modern-card mt-4">
                <div className="p-4 border-bottom d-flex align-items-center gap-3" style={{ borderBottomColor: 'var(--border-color)' }}>
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)' }}>
                    <RefreshCw size={22} />
                  </div>
                  <div>
                    <h3 className="h5 mb-1" style={{ color: 'var(--text-primary)' }}>Maintenance</h3>
                    <small style={{ color: 'var(--text-tertiary)' }}>System maintenance actions</small>
                  </div>
                </div>
                <div className="p-4 d-flex flex-column gap-3">
                  <button className="btn-ghost w-100 justify-content-between text-start p-3" style={{ borderRadius: 12, background: 'var(--bg-tertiary)' }} onClick={async () => {
                    try {
                      await apiClient.files.cleanup()
                      showSuccess('Cache Cleared', 'System cache has been cleared successfully')
                    } catch { showError('Failed', 'Could not clear system cache') }
                  }}>
                    <span style={{ color: 'var(--text-primary)' }}>Clear System Cache</span>
                    <small style={{ color: 'var(--text-tertiary)' }}>Run now</small>
                  </button>
                  <button className="btn-ghost w-100 justify-content-between text-start p-3" style={{ borderRadius: 12, background: 'var(--bg-tertiary)' }} onClick={() => {
                    try {
                      const url = apiClient.dataExport.download('audit')
                      const link = document.createElement('a')
                      link.href = url; link.target = '_blank'
                      document.body.appendChild(link); link.click(); document.body.removeChild(link)
                      showSuccess('Export Started', 'Audit logs are being exported')
                    } catch { showError('Failed', 'Could not export audit logs') }
                  }}>
                    <span style={{ color: 'var(--text-primary)' }}>Export System Logs</span>
                    <small style={{ color: 'var(--text-tertiary)' }}>Download</small>
                  </button>
                  <button className="btn-ghost w-100 justify-content-between text-start p-3" style={{ borderRadius: 12, background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger-500)' }} onClick={async () => {
                    if (!confirm('Run database cleanup? This will remove old notifications, expired transfers, and stale audit logs.')) return
                    try {
                      await apiClient.files.cleanup()
                      showSuccess('Cleanup Complete', 'Database maintenance completed successfully')
                    } catch { showError('Failed', 'Could not run database cleanup') }
                  }}>
                    <span>Run Database Cleanup</span>
                    <small>Maintenance</small>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
