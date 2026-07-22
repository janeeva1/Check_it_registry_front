import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Smartphone,
  FileText,
  Activity,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import KYCVerificationModal from '../components/KYCVerificationModal'
import { apiClient } from '../lib/apiClient'

// Interface matching the backend response
interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  region?: string
  role: string
  profile_image_url?: string
  verified_photo_url?: string
  created_at: string
  verified_at?: string
  last_login_at?: string
  login_count: number
  kyc_status: 'unverified' | 'pending' | 'verified' | 'failed'
  is_verified: boolean
  caution_flag: boolean
}

// Mock stats for now
interface ProfileStats {
  total_devices: number
  verified_devices: number
  total_reports: number
  active_transfers: number
}

export default function Profile() {
  const { user: authUser, updateUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'activity'>('overview')
  const [showKYCModal, setShowKYCModal] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    region: ''
  })
  
  const { toasts, removeToast, showSuccess, showError } = useToast()
  
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
  const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        if (authUser) {
          setProfile(authUser as any)
          setFormData({
            name: authUser.name,
            phone: (authUser as any).phone || '',
            region: (authUser as any).region || ''
          })
        }
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData({
          name: data.user.name,
          phone: data.user.phone || '',
          region: data.user.region || ''
        })

        setStats({
          total_devices: Math.floor(Math.random() * 5),
          verified_devices: Math.floor(Math.random() * 3),
          total_reports: 0,
          active_transfers: 0
        })
      } else {
        throw new Error('Failed to load profile')
      }

    } catch (err) {
      console.error('Error loading profile:', err)
      showError('Loading Error', 'Failed to load latest profile data')
      if (authUser) setProfile(authUser as any)
    } finally {
      setLoading(false)
    }
  }, [authUser, API_URL, showError])

  useEffect(() => {
    loadProfile()
  }, [authUser, loadProfile]) 

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          region: formData.region
        })
      })

      const data = await response.json()

      if (response.ok) {
        setProfile(data.user)
        updateUser(data.user)
        setEditing(false)
        showSuccess('Profile Updated', 'Your profile has been updated successfully')
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }

    } catch (err: any) {
      console.error('Error saving profile:', err)
      showError('Save Failed', err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const result = await apiClient.profile.uploadImage(file)
      if (result?.image_url) {
        setProfile(prev => prev ? { ...prev, profile_image_url: result.image_url } : null)
        showSuccess('Profile photo updated')
      }
    } catch (err: any) {
      showError(err.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
    e.target.value = ''
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone || '',
        region: profile.region || ''
      })
    }
    setEditing(false)
  }

  const handleKYCSuccess = () => {
    loadProfile();
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'var(--danger-500)'
      case 'lea': return 'var(--warning-500)'
      case 'business': return 'var(--primary-500)'
      default: return 'var(--success-500)'
    }
  }

  if (loading && !profile) {
    return (
      <Layout requireAuth>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '600px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!profile) return null

  return (
    <Layout requireAuth>
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div>
                <h1 className="display-6 fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  My Profile
                </h1>
                <p className="mb-0 text-muted">
                  Manage your personal information and account settings
                </p>
              </div>
              
              <div className="d-flex gap-2 align-items-center flex-wrap w-100">
                {/* KYC Buttons */}
                {profile.kyc_status !== 'verified' && profile.kyc_status !== 'pending' && (
                  <button 
                    onClick={() => setShowKYCModal(true)}
                    className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm text-white border-0"
                    style={{ background: 'var(--success-500)' }}
                  >
                    <Shield size={18} />
                    Verify Identity
                  </button>
                )}

                {profile.kyc_status === 'pending' && (
                  <button 
                    disabled
                    className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm text-dark border-0"
                    style={{ background: 'var(--warning-500)', opacity: 0.8 }}
                  >
                    <Clock size={18} />
                    Verification Pending
                  </button>
                )}

                {!editing ? (
                  <button 
                    onClick={() => setEditing(true)}
                    className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm text-white border-0"
                    style={{ background: 'var(--primary-500)' }}
                  >
                    <Edit3 size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="d-flex gap-2 flex-wrap">
                    <button 
                      onClick={handleCancel}
                      className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill border"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      disabled={saving}
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm text-white border-0"
                      style={{ background: 'var(--primary-500)' }}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {profile.kyc_status === 'failed' && (
           <div className="alert alert-danger d-flex align-items-center gap-3 rounded-4 shadow-sm border-0 mb-4 px-4 py-3">
             <AlertTriangle size={24} className="flex-shrink-0" />
             <div>
               <strong>Identity Verification Failed</strong>
               <p className="mb-0 small">Your recent verification attempt failed. Please ensure your selfie is clear and try again.</p>
             </div>
             <button onClick={() => setShowKYCModal(true)} className="btn btn-outline-danger btn-sm ms-auto px-3 rounded-pill">Retry</button>
           </div>
        )}

        {profile.caution_flag && (
           <div className="alert alert-warning d-flex align-items-center gap-3 rounded-4 shadow-sm border-0 mb-4 px-4 py-3">
             <AlertCircle size={24} className="flex-shrink-0" />
             <div>
               <strong>Account Caution</strong>
               <p className="mb-0 small">Your account is flagged for caution. Please complete identity verification to remove this flag.</p>
             </div>
           </div>
        )}

        <div className="row g-4">
          {/* Main Profile Card - Left Column */}
          <div className="col-lg-4">
            {/* Identity Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border-0 shadow-sm overflow-hidden mb-4"
              style={{ borderRadius: '16px', background: 'var(--bg-primary)' }}
            >
              <div 
                className="position-relative" 
                style={{ 
                  height: '120px', 
                  background: 'linear-gradient(135deg, var(--primary-100) 0%, var(--primary-50) 100%)' 
                }}
              >
                <div 
                  className="position-absolute start-50 translate-middle-x"
                  style={{ bottom: '-40px' }}
                >
                  <div className="position-relative">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt={profile.name}
                        className="rounded-circle border border-4 border-white shadow-sm"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold border border-4 border-white shadow-sm"
                        style={{ 
                          width: '100px', 
                          height: '100px',
                          background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                          fontSize: '32px'
                        }}
                      >
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Verified Checkmark */}
                    {profile.is_verified && (
                      <div 
                        className="position-absolute bottom-0 end-0 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                        style={{ width: '32px', height: '32px', zIndex: 10 }}
                        title="Identity Verified"
                      >
                        <CheckCircle size={20} className="text-success fill-success" />
                      </div>
                    )}
                    
                    {editing && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                        />
                        <button 
                          className="btn btn-sm btn-light rounded-circle position-absolute bottom-0 end-0 shadow-sm border"
                          style={{ width: '32px', height: '32px', padding: 0, right: profile.is_verified ? '-35px' : '0' }}
                          title="Change Photo"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? <Loader2 size={14} className="spinner-border spinner-border-sm" /> : <Camera size={14} className="text-muted" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-body text-center pt-5 pb-4 px-4">
                <h3 className="h4 fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {profile.name}
                </h3>
                <p className="text-muted mb-3">{profile.email}</p>
                
                {/* Two-image display: profile photo + KYC verification photo */}
                {profile.verified_photo_url && (
                  <div className="d-flex justify-content-center gap-3 mb-3">
                    <div className="text-center">
                      <img
                        src={profile.profile_image_url || 'https://via.placeholder.com/60'}
                        alt="Profile"
                        className="rounded-circle border border-2 border-white shadow-sm"
                        style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                      />
                      <small className="d-block text-muted" style={{ fontSize: 10, marginTop: 2 }}>Profile</small>
                    </div>
                    <div className="text-center">
                      <img
                        src={profile.verified_photo_url}
                        alt="Verified ID"
                        className="rounded-circle border border-2 border-success shadow-sm"
                        style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                      />
                      <small className="d-block text-success" style={{ fontSize: 10, marginTop: 2 }}>Verified ID</small>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-center gap-2 mb-4">
                  <span 
                    className="badge py-2 px-3 rounded-pill"
                    style={{ 
                      backgroundColor: `${getRoleColor(profile.role)}15`,
                      color: getRoleColor(profile.role),
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    <Shield size={12} className="me-1 mb-1" />
                    {profile.role.toUpperCase()}
                  </span>
                  
                  {profile.is_verified ? (
                    <span 
                      className="badge py-2 px-3 rounded-pill bg-success-subtle text-success"
                      style={{ fontSize: '12px', fontWeight: 600 }}
                    >
                      <CheckCircle size={12} className="me-1 mb-1" />
                      VERIFIED
                    </span>
                  ) : (
                    <span 
                      className="badge py-2 px-3 rounded-pill bg-secondary-subtle text-secondary"
                      style={{ fontSize: '12px', fontWeight: 600 }}
                    >
                      UNVERIFIED
                    </span>
                  )}
                </div>

                <div className="row g-0 border-top pt-4">
                  <div className="col-6 border-end">
                    <p className="mb-0 text-muted small fw-medium">Member Since</p>
                    <p className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                      {new Date(profile.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="col-6">
                    <p className="mb-0 text-muted small fw-medium">Last Login</p>
                    <p className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                      {profile.last_login_at 
                        ? new Date(profile.last_login_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Identity Verification Card - Prominent Call to Action */}
            {profile.kyc_status !== 'verified' && profile.kyc_status !== 'pending' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card border-0 shadow-sm overflow-hidden mb-4"
                style={{ 
                  borderRadius: '16px', 
                  background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
                  color: 'white'
                }}
              >
                <div className="card-body p-4 position-relative">
                  <div 
                    className="position-absolute" 
                    style={{ 
                      top: '-20px', 
                      right: '-20px', 
                      opacity: 0.1, 
                      transform: 'rotate(15deg)' 
                    }}
                  >
                    <Shield size={120} />
                  </div>
                  
                  <div className="position-relative z-1">
                    <div className="mb-3 d-inline-flex p-2 rounded-circle bg-white bg-opacity-25">
                      <Shield size={24} className="text-white" />
                    </div>
                    <h5 className="fw-bold mb-2">Verify Your Identity</h5>
                    <p className="small mb-4 text-white-50">
                      Unlock full access and build trust by verifying your NIN. It takes less than 2 minutes.
                    </p>
                <button 
                  onClick={() => setShowKYCModal(true)}
                  className="btn w-100 fw-bold border-0 shadow-sm text-white"
                  style={{ background: 'var(--primary-500)' }}
                >
                  Start Verification
                </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card border-0 shadow-sm overflow-hidden"
              style={{ borderRadius: '16px', background: 'var(--bg-primary)' }}
            >
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Quick Actions</h5>
                <div className="d-flex flex-column gap-2">
                  <Link to="/my-devices" className="btn d-flex align-items-center gap-3 rounded-3 text-start p-3 border-0"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <Smartphone size={18} style={{ color: 'var(--primary-500)' }} />
                    <span className="fw-medium">Manage Devices</span>
                  </Link>
                  <Link to="/reports" className="btn d-flex align-items-center gap-3 rounded-3 text-start p-3 border-0"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <FileText size={18} style={{ color: 'var(--danger-500)' }} />
                    <span className="fw-medium">View Reports</span>
                  </Link>
                  <Link to="/transfer" className="btn d-flex align-items-center gap-3 rounded-3 text-start p-3 border-0"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <Activity size={18} style={{ color: 'var(--success-500)' }} />
                    <span className="fw-medium">Device Transfers</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Details Column - Right Side */}
          <div className="col-lg-8">
            <div 
              className="card border-0 shadow-sm mb-4 ps-3"
              style={{ borderRadius: '16px', background: 'var(--bg-primary)' }}
            >
              {/* Tabs Navigation */}
              <div className="card-header bg-transparent border-bottom pt-4 pb-0 px-4">
                <nav className="nav nav-pills gap-1 flex-nowrap overflow-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`nav-link px-3 px-sm-4 py-3 fw-medium`}
                    style={{ 
                      background: activeTab === 'overview' ? 'var(--bg-tertiary)' : 'transparent',
                      color: activeTab === 'overview' ? 'var(--primary-500)' : 'var(--text-secondary)',
                      borderBottom: activeTab === 'overview' ? '3px solid var(--primary-500)' : '3px solid transparent',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`nav-link px-3 px-sm-4 py-3 fw-medium`}
                    style={{ 
                      background: activeTab === 'security' ? 'var(--bg-tertiary)' : 'transparent',
                      color: activeTab === 'security' ? 'var(--primary-500)' : 'var(--text-secondary)',
                      borderBottom: activeTab === 'security' ? '3px solid var(--primary-500)' : '3px solid transparent',
                      whiteSpace: 'nowrap'
                    }}
                  >
                     Security
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`nav-link px-3 px-sm-4 py-3 fw-medium`}
                    style={{ 
                      background: activeTab === 'activity' ? 'var(--bg-tertiary)' : 'transparent',
                      color: activeTab === 'activity' ? 'var(--primary-500)' : 'var(--text-secondary)',
                      borderBottom: activeTab === 'activity' ? '3px solid var(--primary-500)' : '3px solid transparent',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Activity Log
                  </button>
                </nav>
              </div>

              <div className="card-body p-4 p-lg-5">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h5 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h5>
                      
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                          {editing ? (
                            <input
                              type="text"
                              className="form-control form-control-lg bg-light border-0"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          ) : (
                            <div className="d-flex align-items-center p-3 bg-light rounded-3">
                              <User size={20} className="text-muted me-3" />
                              <span className="fw-medium text-dark">{profile.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-bold text-uppercase">Email Address</label>
                          <div className="d-flex align-items-center p-3 bg-light rounded-3 opacity-75">
                            <Mail size={20} className="text-muted me-3" />
                            <span className="fw-medium text-dark">{profile.email}</span>
                            <span className="ms-auto badge bg-secondary-subtle text-secondary">Read-only</span>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-bold text-uppercase">Phone Number</label>
                          {editing ? (
                            <input
                              type="tel"
                              className="form-control form-control-lg bg-light border-0"
                              value={formData.phone}
                              placeholder="+234..."
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          ) : (
                            <div className="d-flex align-items-center p-3 bg-light rounded-3">
                              <Phone size={20} className="text-muted me-3" />
                              <span className="fw-medium text-dark">{profile.phone || 'Not provided'}</span>
                            </div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-bold text-uppercase">Region / Location</label>
                          {editing ? (
                            <select
                              className="form-select form-select-lg bg-light border-0"
                              value={formData.region}
                              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                            >
                              <option value="">Select Region</option>
                              <option value="Lagos">Lagos</option>
                              <option value="Abuja">Abuja</option>
                              <option value="Kano">Kano</option>
                              <option value="Rivers">Rivers</option>
                              <option value="Oyo">Oyo</option>
                              <option value="Enugu">Enugu</option>
                            </select>
                          ) : (
                            <div className="d-flex align-items-center p-3 bg-light rounded-3">
                              <MapPin size={20} className="text-muted me-3" />
                              <span className="fw-medium text-dark">{profile.region || 'Not specified'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <hr className="my-5 opacity-10" />

                      <h5 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Account Statistics</h5>
                      {stats && (
                        <div className="row g-3">
                          <div className="col-sm-6 col-md-3">
                            <div className="p-3 rounded-3 text-center bg-primary-subtle bg-opacity-10 h-100 border border-primary-subtle">
                              <h3 className="fw-bold text-primary mb-1">{stats.total_devices}</h3>
                              <p className="small text-muted mb-0 fw-medium">Total Devices</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-md-3">
                            <div className="p-3 rounded-3 text-center bg-success-subtle bg-opacity-10 h-100 border border-success-subtle">
                              <h3 className="fw-bold text-success mb-1">{stats.verified_devices}</h3>
                              <p className="small text-muted mb-0 fw-medium">Verified</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-md-3">
                            <div className="p-3 rounded-3 text-center bg-danger-subtle bg-opacity-10 h-100 border border-danger-subtle">
                              <h3 className="fw-bold text-danger mb-1">{stats.total_reports}</h3>
                              <p className="small text-muted mb-0 fw-medium">Incidents</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-md-3">
                            <div className="p-3 rounded-3 text-center bg-warning-subtle bg-opacity-10 h-100 border border-warning-subtle">
                              <h3 className="fw-bold text-warning mb-1">{stats.active_transfers}</h3>
                              <p className="small text-muted mb-0 fw-medium">Transfers</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h5 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Security Settings</h5>
                      
                      <div className="d-flex flex-column gap-3">
                        <div className="p-4 border rounded-3 d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 bg-white shadow-sm">
                          <div className="d-flex align-items-start gap-3">
                            <div className="p-2 rounded-circle bg-light">
                              <KeyRound size={24} className="text-secondary" />
                            </div>
                            <div>
                              <h6 className="fw-bold mb-1 text-dark">Password</h6>
                              <p className="text-muted small mb-0">Last changed 30 days ago</p>
                            </div>
                          </div>
                          <Link to="/password-reset" className="btn btn-sm px-3 rounded-pill fw-medium"
                            style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
                            Change Password
                          </Link>
                        </div>

                        <div className="p-4 border rounded-3 d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 bg-white shadow-sm">
                          <div className="d-flex align-items-start gap-3">
                            <div className="p-2 rounded-circle bg-light">
                              <Shield size={24} className="text-success" />
                            </div>
                            <div>
                              <h6 className="fw-bold mb-1 text-dark">Two-Factor Authentication</h6>
                              <p className="text-muted small mb-0">Add an extra layer of security to your account</p>
                            </div>
                          </div>
                          <div className="form-check form-switch ps-0">
                            <Link to="/settings" className="btn btn-sm rounded-pill px-3 fw-medium"
                              style={{ border: '1px solid var(--primary-500)', color: 'var(--primary-500)', background: 'transparent' }}>Configure</Link>
                          </div>
                        </div>

                        <div className="p-4 border rounded-3 d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 bg-white shadow-sm">
                          <div className="d-flex align-items-start gap-3">
                            <div className="p-2 rounded-circle bg-light">
                              <Activity size={24} className="text-warning" />
                            </div>
                            <div>
                              <h6 className="fw-bold mb-1 text-dark">Active Sessions</h6>
                              <p className="text-muted small mb-0">Manage devices where you're currently logged in</p>
                            </div>
                          </div>
                          <button className="btn btn-sm px-3 rounded-pill fw-medium"
                            style={{ border: '1px solid var(--danger-500)', color: 'var(--danger-500)', background: 'transparent' }}>
                            Manage Sessions
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'activity' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h5 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h5>
                      
                      <div className="d-flex flex-column gap-3">
                        <div className="d-flex gap-3 p-3 border-bottom border-light">
                          <div className="mt-1">
                            <div className="rounded-circle bg-success-subtle p-2">
                              <CheckCircle size={16} className="text-success" />
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 fw-bold text-dark">Profile Updated</p>
                            <p className="small text-muted mb-0">You updated your profile information</p>
                            <span className="text-muted" style={{ fontSize: '11px' }}>Just now</span>
                          </div>
                        </div>
                        
                        {profile.kyc_status === 'verified' && (
                          <div className="d-flex gap-3 p-3 border-bottom border-light">
                            <div className="mt-1">
                              <div className="rounded-circle bg-success-subtle p-2">
                                <Shield size={16} className="text-success" />
                              </div>
                            </div>
                            <div>
                              <p className="mb-1 fw-bold text-dark">Identity Verified</p>
                              <p className="small text-muted mb-0">Your identity was successfully verified via NIN</p>
                              <span className="text-muted" style={{ fontSize: '11px' }}>Recently</span>
                            </div>
                          </div>
                        )}

                        <div className="d-flex gap-3 p-3 border-bottom border-light">
                          <div className="mt-1">
                            <div className="rounded-circle bg-primary-subtle p-2">
                              <User size={16} className="text-primary" />
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 fw-bold text-dark">Login Successful</p>
                            <p className="small text-muted mb-0">Logged in from Windows PC (Chrome)</p>
                            <span className="text-muted" style={{ fontSize: '11px' }}>2 hours ago</span>
                          </div>
                        </div>
                        
                        <div className="text-center mt-3">
                          <button className="btn btn-link text-decoration-none text-muted small">View Full History</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        
        <KYCVerificationModal 
          isOpen={showKYCModal} 
          onClose={() => setShowKYCModal(false)}
          onSuccess={handleKYCSuccess}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}