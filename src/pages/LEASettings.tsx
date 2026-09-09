import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'
import {
  Settings, User, Bell, Shield, EyeOff, Save,
  Globe, Lock, Clock, Smartphone, Mail, Phone, MapPin,
  Building, AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react'

interface LEAProfile {
  agencyName: string
  agencyCode: string
  jurisdiction: string
  region: string
  commanderName: string
  commanderEmail: string
  commanderPhone: string
  address: string
}

interface NotificationPrefs {
  email_alerts: boolean
  sms_alerts: boolean
  critical_alerts: boolean
  daily_digest: boolean
  new_reports: boolean
  recovery_updates: boolean
  transfer_notifications: boolean
}

export default function LEASettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'preferences'>('profile')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const [profile, setProfile] = useState<LEAProfile>({
    agencyName: '',
    agencyCode: '',
    jurisdiction: 'Federal',
    region: '',
    commanderName: '',
    commanderEmail: '',
    commanderPhone: '',
    address: '',
  })

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    email_alerts: true,
    sms_alerts: false,
    critical_alerts: true,
    daily_digest: false,
    new_reports: true,
    recovery_updates: true,
    transfer_notifications: false,
  })

  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data: any = await apiClient.leaPortal.getSettings()
      if (data?.profile) {
        setProfile({
          agencyName: data.agency?.name || '',
          agencyCode: data.agency?.abbreviation || '',
          jurisdiction: data.agency?.jurisdiction || 'Federal',
          region: data.profile.region || '',
          commanderName: data.profile.name || '',
          commanderEmail: data.profile.email || '',
          commanderPhone: data.profile.phone || '',
          address: data.agency?.address || '',
        })
      }
      if (data?.notifications) {
        setNotifications({
          email_alerts: !!data.notifications.email_alerts,
          sms_alerts: !!data.notifications.sms_alerts,
          critical_alerts: !!data.notifications.critical_alerts,
          daily_digest: !!data.notifications.daily_digest,
          new_reports: !!data.notifications.new_reports,
          recovery_updates: !!data.notifications.recovery_updates,
          transfer_notifications: !!data.notifications.transfer_notifications,
        })
      }
    } catch (err: any) {
      showError('Load Failed', err?.message || 'Could not load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiClient.leaPortal.updateSettings({
        region: profile.region,
        notifications,
      })
      setSaved(true)
      showSuccess('Settings Saved', 'Your changes have been applied successfully.')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      showError('Save Failed', err?.message || 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  const childVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  }

  const tabs = [
    { key: 'profile', label: 'Agency Profile', icon: Building },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'preferences', label: 'Security & Preferences', icon: Shield },
  ] as const

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--primary-500)' : 'var(--gray-300)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </button>
  )

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['lea']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['lea']}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <motion.div className="container-fluid" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={childVariants} className="page-header">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={24} color="white" />
            </div>
            <div>
              <h1>LEA Settings</h1>
              <p>Manage your agency profile, notifications, and security preferences</p>
            </div>
          </div>
        </motion.div>

        {saved && (
          <motion.div variants={childVariants} className="alert-banner alert-banner-success mb-4">
            <CheckCircle size={20} />
            <div>
              <strong>Settings Saved</strong>
              <div className="small">Your changes have been applied successfully.</div>
            </div>
          </motion.div>
        )}

        <motion.div variants={childVariants} className="d-flex gap-2 mb-4 flex-wrap">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`btn-ghost ${isActive ? 'nav-item-active' : ''}`}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(34,197,94,0.08)' : 'transparent',
                  color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500
                }}
              >
                <Icon size={18} /> {tab.label}
              </button>
            )
          })}
        </motion.div>

        {activeTab === 'profile' && (
          <motion.div variants={childVariants} className="modern-card p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', fontSize: 28 }}>
                {(profile.agencyName || 'LE').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <h3 className="h5 mb-1">{profile.agencyName || 'LEA Agency'}</h3>
                <div className="text-muted small d-flex align-items-center gap-2">
                  <Shield size={14} /> {profile.agencyCode || 'N/A'} &bull; {profile.jurisdiction} Jurisdiction
                </div>
              </div>
            </div>
            <div style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:12}}><span style={{color:'red'}}>*</span> Required fields</div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label"><Building size={14} className="me-1" />Agency Name <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                <input className="modern-input" value={profile.agencyName} onChange={e => setProfile({ ...profile, agencyName: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Agency Code <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                <input className="modern-input" value={profile.agencyCode} onChange={e => setProfile({ ...profile, agencyCode: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label"><Shield size={14} className="me-1" />Jurisdiction <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                <select className="modern-select" value={profile.jurisdiction} onChange={e => setProfile({ ...profile, jurisdiction: e.target.value })}>
                  <option value="Federal">Federal</option>
                  <option value="State">State</option>
                  <option value="Local">Local</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label"><MapPin size={14} className="me-1" />Region <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                <input className="modern-input" value={profile.region} onChange={e => setProfile({ ...profile, region: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Address <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                <input className="modern-input" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label"><User size={14} className="me-1" />Commander Name <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                <input className="modern-input" value={profile.commanderName} onChange={e => setProfile({ ...profile, commanderName: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label"><Mail size={14} className="me-1" />Commander Email <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                <input className="modern-input" type="email" value={profile.commanderEmail} onChange={e => setProfile({ ...profile, commanderEmail: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label"><Phone size={14} className="me-1" />Commander Phone <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                <input className="modern-input" value={profile.commanderPhone} onChange={e => setProfile({ ...profile, commanderPhone: e.target.value })} />
              </div>
            </div>
            <div className="mt-4">
              <button className="btn-gradient-primary" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={18} className="spinner" /> : <Save size={18} />} Save Changes
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div variants={childVariants} className="modern-card p-4">
            <div className="d-flex align-items-center gap-2 mb-4">
              <Bell size={18} />
              <span className="fw-semibold">Notification Preferences</span>
            </div>
            <div className="d-flex flex-column gap-3">
              {[
                { key: 'email_alerts', label: 'Email Alerts', desc: 'Receive alert notifications via email' },
                { key: 'sms_alerts', label: 'SMS Alerts', desc: 'Receive critical alerts via SMS' },
                { key: 'critical_alerts', label: 'Critical Alerts', desc: 'Immediate notifications for critical severity alerts' },
                { key: 'daily_digest', label: 'Daily Digest', desc: 'Receive a daily summary of all alerts and updates' },
                { key: 'new_reports', label: 'New Reports', desc: 'Notify when new device reports are filed in your region' },
                { key: 'recovery_updates', label: 'Recovery Updates', desc: 'Updates on recovery operation status changes' },
                { key: 'transfer_notifications', label: 'Transfer Notifications', desc: 'Notifications for ownership transfers in your region' },
              ].map(item => (
                <div key={item.key} className="d-flex align-items-center justify-content-between p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                  <div>
                    <div className="fw-medium small">{item.label}</div>
                    <div className="text-muted small">{item.desc}</div>
                  </div>
                  <Toggle
                    checked={notifications[item.key as keyof NotificationPrefs]}
                    onChange={v => setNotifications({ ...notifications, [item.key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="btn-gradient-primary" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={18} className="spinner" /> : <Save size={18} />} Save Preferences
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div variants={childVariants} className="modern-card p-4">
            <div className="d-flex align-items-center gap-2 mb-4">
              <Shield size={18} />
              <span className="fw-semibold">Security & Preferences</span>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <div className="fw-medium small d-flex align-items-center gap-2">
                        <Lock size={16} /> Two-Factor Authentication
                      </div>
                      <div className="text-muted small">Extra security layer for your account</div>
                    </div>
                    <Toggle checked={twoFactor} onChange={setTwoFactor} />
                  </div>
                  {twoFactor && (
                    <div className="alert-banner alert-banner-info small mt-2 mb-0">
                      <Shield size={14} />
                      <span>2FA is active. Authenticator app required for login.</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                  <div className="fw-medium small d-flex align-items-center gap-2 mb-2">
                    <Clock size={16} /> Session Timeout (minutes)
                  </div>
                  <select className="modern-select" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                  <div className="fw-medium small d-flex align-items-center gap-2 mb-2">
                    <Globe size={16} /> Language / Locale
                  </div>
                  <select className="modern-select">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                  <div className="fw-medium small d-flex align-items-center gap-2 mb-2">
                    <Smartphone size={16} /> Default Device View
                  </div>
                  <select className="modern-select">
                    <option value="table">Table View</option>
                    <option value="grid">Grid View</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="section-divider" />

            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-danger">
                <AlertTriangle size={16} />
                <span className="small fw-medium">Danger Zone</span>
              </div>
              <button className="btn-gradient-danger">
                <EyeOff size={16} /> Deactivate Account
              </button>
            </div>

            <div className="mt-4">
              <button className="btn-gradient-primary" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={18} className="spinner" /> : <Save size={18} />} Save All Changes
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  )
}
