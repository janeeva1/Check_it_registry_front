import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Smartphone,
  Eye,
  Save,
  RefreshCw,
  Lock,
  Key,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { useTheme } from '../contexts/ThemeContext'
import { apiClient } from '../lib/apiClient'

interface UserPreferences {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  device_alerts: boolean
  transfer_notifications: boolean
  verification_notifications: boolean
  report_updates: boolean
  marketing_emails: boolean
  language: string
  timezone: string
  two_factor_enabled: boolean
}

export default function Settings() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    device_alerts: true,
    transfer_notifications: true,
    verification_notifications: true,
    report_updates: true,
    marketing_emails: false,
    language: 'en',
    timezone: 'Africa/Lagos',
    two_factor_enabled: false
  })

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'appearance' | 'privacy' | 'security'>('notifications')
  const { theme, toggleTheme } = useTheme()
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Export state
  const [exporting, setExporting] = useState(false)

  // Delete account state
  const [deleteStep, setDeleteStep] = useState(0)
  const [deletePassword, setDeletePassword] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteOtp, setDeleteOtp] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [hasSecurityQuestion, setHasSecurityQuestion] = useState<boolean | null>(null)

  // Security question state
  const [sqQuestion, setSqQuestion] = useState('')
  const [sqAnswer, setSqAnswer] = useState('')
  const [sqSaving, setSqSaving] = useState(false)
  const [showSqSetup, setShowSqSetup] = useState(false)

  useEffect(() => {
    apiClient.securityQuestions.get().then((r: any) => {
      setHasSecurityQuestion(r.hasSecurityQuestion)
    }).catch(() => setHasSecurityQuestion(false))
    apiClient.profile.getPreferences().then((r: any) => {
      if (r?.preferences) {
        setPreferences(prev => ({
          ...prev,
          email_notifications: r.preferences.email_notifications ?? prev.email_notifications,
          sms_notifications: r.preferences.sms_notifications ?? prev.sms_notifications,
          push_notifications: r.preferences.push_notifications ?? prev.push_notifications,
          device_alerts: r.preferences.device_alerts ?? prev.device_alerts,
          transfer_notifications: r.preferences.transfer_notifications ?? prev.transfer_notifications,
          verification_notifications: r.preferences.verification_notifications ?? prev.verification_notifications,
          report_updates: r.preferences.report_updates ?? prev.report_updates,
          marketing_emails: r.preferences.marketing_emails ?? prev.marketing_emails,
          language: r.preferences.language ?? prev.language,
          timezone: r.preferences.timezone ?? prev.timezone,
          two_factor_enabled: r.preferences.two_factor_enabled ?? prev.two_factor_enabled,
        }))
      }
    }).catch(() => {})
  }, [])

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiClient.profile.updatePreferences(preferences)
      showSuccess('Settings Saved', 'Your preferences have been updated successfully')
    } catch (err) {
      showError('Save Failed', 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  // Export
  const handleExport = async () => {
    try {
      setExporting(true)
      const url = apiClient.dataExport.download('full')
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess('Export Started', 'Your data export is being prepared and will download shortly.')
    } catch (err) {
      showError('Export Failed', 'Could not start data export')
    } finally {
      setExporting(false)
    }
  }

  // Delete account flow
  const resetDelete = () => {
    setDeleteStep(0)
    setDeletePassword('')
    setSecurityAnswer('')
    setDeleteReason('')
    setDeleteOtp('')
    setDeleteConfirmText('')
  }

  const handleDeleteVerifyPassword = async () => {
    if (!deletePassword) return
    try {
      setDeleteLoading(true)
      await apiClient.accountDeletion.verifyPassword(deletePassword)
      setDeleteStep(2)
      showSuccess('Verified', 'Password verified')
    } catch (err: any) {
      showError('Verification Failed', err.message || 'Invalid password')
    } finally { setDeleteLoading(false) }
  }

  const handleDeleteVerifySecurity = async () => {
    if (!securityAnswer) return
    try {
      setDeleteLoading(true)
      await apiClient.accountDeletion.verifySecurity(securityAnswer)
      setDeleteStep(3)
      showSuccess('Verified', 'Security answer verified')
    } catch (err: any) {
      showError('Verification Failed', err.message || 'Incorrect answer')
    } finally { setDeleteLoading(false) }
  }

  const handleDeleteResendOtp = async () => {
    try {
      await apiClient.accountDeletion.resendOtp()
      showSuccess('OTP Sent', 'A new OTP has been sent to your phone/email')
    } catch (err: any) {
      showError('Failed', err.message || 'Could not send OTP')
    }
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      showError('Invalid', 'Type DELETE MY ACCOUNT to confirm')
      return
    }
    try {
      setDeleteLoading(true)
      await apiClient.accountDeletion.delete({
        reason: deleteReason,
        otpCode: deleteOtp,
        confirmText: deleteConfirmText,
      })
      showSuccess('Account Deleted', 'Your account has been deleted. You will be logged out shortly.')
      setTimeout(() => { window.location.href = '/login' }, 3000)
    } catch (err: any) {
      showError('Deletion Failed', err.message || 'Could not delete account')
    } finally { setDeleteLoading(false) }
  }

  // Security question
  const handleSaveSecurityQuestion = async () => {
    if (!sqQuestion.trim() || !sqAnswer.trim()) {
      showError('Required', 'Enter both a question and answer')
      return
    }
    try {
      setSqSaving(true)
      await apiClient.securityQuestions.setup({ question: sqQuestion, answer: sqAnswer })
      showSuccess('Saved', 'Security question set up successfully')
      setHasSecurityQuestion(true)
      setShowSqSetup(false)
      setSqQuestion('')
      setSqAnswer('')
    } catch (err: any) {
      showError('Failed', err.message || 'Could not save security question')
    } finally { setSqSaving(false) }
  }

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <Layout requireAuth>
      <div className="container-fluid">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="row mb-3 mb-md-5">
          <div className="col-12">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
              <div className="mb-3 mb-sm-0">
                <h1 className="display-6 fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Settings</h1>
                <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>Customize your preferences and account settings</p>
              </div>
              <button onClick={handleSave} className="btn-gradient-primary d-flex align-items-center gap-2" disabled={saving}>
                {saving ? (<><div className="spinner-border spinner-border-sm" role="status" /><span>Saving...</span></>) : (<><Save size={18} />Save Changes</>)}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="row g-4">
          <div className="col-lg-3">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="modern-card p-3">
              <nav className="nav flex-column">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                      className={`nav-link d-flex align-items-center gap-3 p-3 rounded-3 border-0 text-start ${activeTab === tab.id ? 'active' : ''}`}
                      style={{
                        backgroundColor: activeTab === tab.id ? 'var(--primary-100)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                        marginBottom: '8px'
                      }}>
                      <IconComponent size={20} /><span className="fw-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </motion.div>
          </div>

          <div className="col-lg-9">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="modern-card p-4">

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="h5 mb-4" style={{ color: 'var(--text-primary)' }}><Bell size={20} className="me-2" />Notification Preferences</h3>
                  <div className="row g-4">
                    <div className="col-12">
                      <h6 className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Device & Security Alerts</h6>
                      <div className="d-flex flex-column gap-3">
                        {[
                          { key: 'device_alerts', label: 'Device Alerts', desc: 'Get notified when your devices are checked or reported' },
                          { key: 'transfer_notifications', label: 'Transfer Notifications', desc: 'Notifications about device ownership transfers' },
                          { key: 'report_updates', label: 'Report Updates', desc: 'Updates on your theft and loss reports' },
                        ].map(item => (
                          <div key={item.key} className="d-flex flex-wrap justify-content-between align-items-center p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                            <div><p className="mb-1 fw-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                              <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.desc}</p></div>
                            <div className="form-check form-switch">
                              <input className="form-check-input" type="checkbox" checked={(preferences as any)[item.key]}
                                onChange={(e) => updatePreference(item.key as keyof UserPreferences, e.target.checked)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-12">
                      <h6 className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Communication Channels</h6>
                      <div className="d-flex flex-column gap-3">
                        {[
                          { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email', icon: Mail },
                          { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Receive critical alerts via SMS', icon: Smartphone },
                        ].map(item => (
                          <div key={item.key} className="d-flex flex-wrap justify-content-between align-items-center p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                            <div className="d-flex align-items-center gap-3">
                              <item.icon size={20} style={{ color: 'var(--primary-600)' }} />
                              <div><p className="mb-1 fw-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                                <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.desc}</p></div>
                            </div>
                            <div className="form-check form-switch">
                              <input className="form-check-input" type="checkbox" checked={(preferences as any)[item.key]}
                                onChange={(e) => updatePreference(item.key as keyof UserPreferences, e.target.checked)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h3 className="h5 mb-4" style={{ color: 'var(--text-primary)' }}><Palette size={20} className="me-2" />Appearance & Display</h3>
                  <div className="row g-4">
                    <div className="col-12">
                      <h6 className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Theme Preference</h6>
                      <div className="d-flex flex-wrap justify-content-between align-items-center p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                        <div><p className="mb-1 fw-medium" style={{ color: 'var(--text-primary)' }}>Dark Mode</p>
                          <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Switch between light and dark themes</p></div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: 'var(--text-primary)' }}><Globe size={16} className="me-2" />Language</label>
                      <select className="modern-input" value={preferences.language} onChange={(e) => updatePreference('language', e.target.value)}>
                        <option value="en">English</option>
                        <option value="ha">Hausa</option>
                        <option value="yo">Yoruba</option>
                        <option value="ig">Igbo</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: 'var(--text-primary)' }}>Timezone</label>
                      <select className="modern-input" value={preferences.timezone} onChange={(e) => updatePreference('timezone', e.target.value)}>
                        <option value="Africa/Lagos">West Africa Time (WAT)</option>
                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                        <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h3 className="h5 mb-4" style={{ color: 'var(--text-primary)' }}><Eye size={20} className="me-2" />Privacy & Data</h3>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-center p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                      <div><p className="mb-1 fw-medium" style={{ color: 'var(--text-primary)' }}>Marketing Emails</p>
                        <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Receive promotional emails and product updates</p></div>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={preferences.marketing_emails}
                          onChange={(e) => updatePreference('marketing_emails', e.target.checked)} />
                      </div>
                    </div>

                    {/* Export */}
                    <div className="p-4 rounded-3 border" style={{ borderColor: 'var(--border-color)' }}>
                      <h6 className="fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Export My Data</h6>
                      <p className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Download a complete copy of your account data, device records, and activity history (JSON format).
                      </p>
                      <button onClick={handleExport} disabled={exporting}
                        className="btn btn-outline-primary d-flex align-items-center gap-2">
                        {exporting ? <div className="spinner-border spinner-border-sm" /> : <Download size={16} />}
                        Export My Data
                      </button>
                    </div>

                    {/* Delete Account */}
                    <div className="p-4 rounded-3 border border-danger" style={{ borderColor: '#fecaca' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <AlertTriangle size={18} className="text-danger" />
                        <h6 className="fw-semibold mb-0 text-danger">Delete Account</h6>
                      </div>
                      <p className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Permanently delete your account and all associated data. This action requires password verification, security question, OTP, and typing "DELETE MY ACCOUNT" to confirm.
                      </p>
                      {deleteStep === 0 ? (
                        <button onClick={() => { resetDelete(); setDeleteStep(1) }}
                          className="btn btn-outline-danger d-flex align-items-center gap-2">
                          <Trash2 size={16} /> Delete My Account
                        </button>
                      ) : (
                        <div className="p-3 rounded-3" style={{ backgroundColor: '#fef2f2' }}>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Step {deleteStep} of 4</span>
                            <button onClick={resetDelete} className="btn btn-sm btn-ghost p-0"><X size={16} /></button>
                          </div>

                          {/* Step 1: Password */}
                          {deleteStep === 1 && (
                            <div>
                              <p className="fw-medium mb-2">Enter your password to verify identity</p>
                              <input type="password" className="form-control mb-3" placeholder="Current password"
                                value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleDeleteVerifyPassword()} />
                              <button onClick={handleDeleteVerifyPassword} disabled={!deletePassword || deleteLoading}
                                className="btn btn-sm btn-danger d-flex align-items-center gap-2">
                                {deleteLoading ? <div className="spinner-border spinner-border-sm" /> : <><ChevronRight size={14} /> Continue</>}
                              </button>
                            </div>
                          )}

                          {/* Step 2: Security Question */}
                          {deleteStep === 2 && (
                            <div>
                              {!hasSecurityQuestion ? (
                                <div>
                                  <p className="fw-medium mb-2">Set up a security question first</p>
                                  <input className="form-control mb-2" placeholder="Security question (e.g. What is your pet's name?)"
                                    value={sqQuestion} onChange={e => setSqQuestion(e.target.value)} />
                                  <input className="form-control mb-2" placeholder="Your answer"
                                    value={sqAnswer} onChange={e => setSqAnswer(e.target.value)} />
                                  <button onClick={async () => { await handleSaveSecurityQuestion(); if (hasSecurityQuestion) setDeleteStep(2) }}
                                    disabled={!sqQuestion.trim() || !sqAnswer.trim() || sqSaving}
                                    className="btn btn-sm btn-primary mb-2">
                                    {sqSaving ? 'Saving...' : 'Save & Continue'}
                                  </button>
                                  <p className="text-secondary" style={{ fontSize: 12 }}>This question will be asked during account deletion and recovery.</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="fw-medium mb-2">Answer your security question</p>
                                  <input className="form-control mb-3" placeholder="Your answer"
                                    value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleDeleteVerifySecurity()} />
                                  <button onClick={handleDeleteVerifySecurity} disabled={!securityAnswer || deleteLoading}
                                    className="btn btn-sm btn-danger d-flex align-items-center gap-2">
                                    {deleteLoading ? <div className="spinner-border spinner-border-sm" /> : <><ChevronRight size={14} /> Continue</>}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Step 3: Reason + OTP */}
                          {deleteStep === 3 && (
                            <div>
                              <p className="fw-medium mb-2">Reason for deletion</p>
                              <select className="form-select mb-3" value={deleteReason} onChange={e => setDeleteReason(e.target.value)}>
                                <option value="">Select a reason...</option>
                                <option value="no_longer_needed">No longer need the service</option>
                                <option value="privacy">Privacy concerns</option>
                                <option value="duplicate">Duplicate account</option>
                                <option value="other">Other</option>
                              </select>
                              <p className="fw-medium mb-2">Enter the OTP sent to your phone/email</p>
                              <div className="d-flex gap-2 align-items-center mb-3">
                                <input className="form-control" placeholder="6-digit OTP" maxLength={6}
                                  value={deleteOtp} onChange={e => setDeleteOtp(e.target.value.replace(/\D/g, ''))} />
                                <button onClick={handleDeleteResendOtp} className="btn btn-sm btn-outline-secondary">Resend</button>
                              </div>
                              <button onClick={() => deleteReason && deleteOtp.length === 6 && setDeleteStep(4)}
                                disabled={!deleteReason || deleteOtp.length < 6}
                                className="btn btn-sm btn-danger d-flex align-items-center gap-2">
                                <ChevronRight size={14} /> Continue
                              </button>
                            </div>
                          )}

                          {/* Step 4: Final Confirmation */}
                          {deleteStep === 4 && (
                            <div>
                              <div className="alert alert-danger">
                                <AlertTriangle size={16} className="me-1" />
                                This action is <strong>irreversible</strong>. All your data, devices, and reports will be deleted.
                              </div>
                              <p className="fw-medium mb-2">Type <code>DELETE MY ACCOUNT</code> to confirm:</p>
                              <input className="form-control mb-3" placeholder="DELETE MY ACCOUNT"
                                value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} />
                              <button onClick={handleDeleteConfirm}
                                disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || deleteLoading}
                                className="btn btn-sm btn-danger d-flex align-items-center gap-2">
                                {deleteLoading ? <div className="spinner-border spinner-border-sm" /> : <><Trash2 size={14} /> Permanently Delete My Account</>}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h3 className="h5 mb-4" style={{ color: 'var(--text-primary)' }}><Shield size={20} className="me-2" />Security Settings</h3>
                  <div className="d-flex flex-column gap-4">
                    {/* 2FA */}
                    <div className="p-4 rounded-3 border" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div><p className="mb-1 fw-medium" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</p>
                          <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Add an extra layer of security to your account</p></div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" checked={preferences.two_factor_enabled}
                            onChange={(e) => updatePreference('two_factor_enabled', e.target.checked)} />
                        </div>
                      </div>
                      {preferences.two_factor_enabled && (
                        <div className="alert alert-success d-flex align-items-center gap-2"><Shield size={16} /><span>Two-factor authentication is enabled</span></div>
                      )}
                    </div>

                    {/* Password */}
                    <div className="p-4 rounded-3 border" style={{ borderColor: 'var(--border-color)' }}>
                      <h6 className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Password & Authentication</h6>
                      <div className="d-flex flex-column flex-sm-row gap-3">
                        <button className="btn btn-outline-primary d-flex align-items-center gap-2"><Lock size={16} />Change Password</button>
                        <button className="btn btn-outline-secondary d-flex align-items-center gap-2"><Key size={16} />Manage API Keys</button>
                      </div>
                    </div>

                    {/* Security Question */}
                    <div className="p-4 rounded-3 border" style={{ borderColor: 'var(--border-color)' }}>
                      <h6 className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Security Question</h6>
                      <p className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        A security question is used to verify your identity during account recovery and deletion.
                      </p>
                      {hasSecurityQuestion ? (
                        <div className="alert alert-success d-flex align-items-center gap-2 mb-0"><CheckCircle size={16} /><span>Security question is set up</span></div>
                      ) : (
                        <div>
                          {!showSqSetup ? (
                            <button onClick={() => setShowSqSetup(true)} className="btn btn-outline-primary d-flex align-items-center gap-2">
                              <Shield size={16} /> Set Up Security Question
                            </button>
                          ) : (
                            <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                              <input className="form-control mb-2" placeholder="Your security question (e.g. What is your pet's name?)"
                                value={sqQuestion} onChange={e => setSqQuestion(e.target.value)} />
                              <input className="form-control mb-2" placeholder="Your answer" value={sqAnswer}
                                onChange={e => setSqAnswer(e.target.value)} />
                              <div className="d-flex gap-2">
                                <button onClick={handleSaveSecurityQuestion} disabled={!sqQuestion.trim() || !sqAnswer.trim() || sqSaving}
                                  className="btn btn-sm btn-primary">
                                  {sqSaving ? 'Saving...' : 'Save Question'}
                                </button>
                                <button onClick={() => setShowSqSetup(false)} className="btn btn-sm btn-outline-secondary">Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sessions */}
                    <div className="p-4 rounded-3 border" style={{ borderColor: 'var(--border-color)' }}>
                      <h6 className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Active Sessions</h6>
                      <div className="d-flex flex-wrap justify-content-between align-items-center p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                        <div><p className="mb-1 fw-medium" style={{ color: 'var(--text-primary)' }}>Current Session</p>
                          <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Windows • Browser</p></div>
                        <span className="badge bg-success">Active</span>
                      </div>
                      <button className="btn btn-outline-danger btn-sm mt-3 d-flex align-items-center gap-2">
                        <RefreshCw size={14} />Revoke All Sessions
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
