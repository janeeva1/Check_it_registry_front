import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'
import { Building2, Loader2, ArrowRight, CheckCircle } from 'lucide-react'

export default function BusinessRegister() {
  const navigate = useNavigate()
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    businessName: '', registrationNumber: '', sector: 'retail',
    country: '', city: '', address: '',
    agree: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name || form.name.length < 2) e.name = 'Full name is required'
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Valid email is required'
    if (!form.password || form.password.length < 8 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Use at least 8 characters with an uppercase letter, a lowercase letter and a number'
    if (!form.businessName) e.businessName = 'Business name is required'
    if (!form.registrationNumber) e.registrationNumber = 'Registration number is required'
    if (!form.country) e.country = 'Country is required'
    if (!form.city) e.city = 'City is required'
    if (!form.address) e.address = 'Address is required'
    if (!form.agree) e.agree = 'You must accept terms'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const nameParts = form.name.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

      const regResult = await apiClient.auth.register({
        first_name: firstName,
        last_name: lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: 'business',
        registrationNumber: form.registrationNumber,
        businessName: form.businessName,
        sector: form.sector,
        country: form.country,
        city: form.city,
        address: form.address,
      })

      if (regResult?.token) {
        localStorage.setItem('auth_token', regResult.token)
      }

      try {
        await apiClient.businessProfile.register({
          businessName: form.businessName,
          registrationNumber: form.registrationNumber,
          sector: form.sector,
          country: form.country,
          city: form.city,
          businessAddress: form.address,
          businessPhone: form.phone,
          businessEmail: form.email,
        })
      } catch (profileErr) {
        console.warn('Profile save failed (user already created):', profileErr)
      }

      showSuccess('Registration Successful', 'Your business account has been created. Please verify your CAC registration.')
      setTimeout(() => navigate('/business-verification'), 1500)
    } catch (err: any) {
      showError('Registration Failed', err.message || 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container py-4" style={{ maxWidth: 640 }}>
        <div className="text-center mb-4">
          <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Building2 size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="fw-bold mb-1">Business Registration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Register your business to access marketplace and device management features</p>
        </div>

        <form onSubmit={onSubmit} className="modern-card p-4">
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}><span style={{ color: 'red' }}>*</span> Required fields</div>

          <h6 style={{ color: 'var(--text-primary)', marginBottom: 12, fontWeight: 600 }}>Account Details</h6>
          <div className="row g-3 mb-4">
            <div className="col-12">
              <label className="form-label">Full Name <span style={{ color: 'red' }}>*</span></label>
              <input className={`modern-input ${errors.name ? 'is-invalid' : ''}`} placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Email <span style={{ color: 'red' }}>*</span></label>
              <input type="email" className={`modern-input ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={e => update('email', e.target.value)} />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Password <span style={{ color: 'red' }}>*</span></label>
              <input type="password" className={`modern-input ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={e => update('password', e.target.value)} />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
            <div className="col-12">
              <label className="form-label">Phone</label>
              <input className="modern-input" placeholder="+234..." value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
          </div>

          <h6 style={{ color: 'var(--text-primary)', marginBottom: 12, fontWeight: 600 }}>Business Details</h6>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <label className="form-label">Business Name <span style={{ color: 'red' }}>*</span></label>
              <input className={`modern-input ${errors.businessName ? 'is-invalid' : ''}`} value={form.businessName} onChange={e => update('businessName', e.target.value)} />
              {errors.businessName && <div className="invalid-feedback">{errors.businessName}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Registration Number (RC) <span style={{ color: 'red' }}>*</span></label>
              <input className={`modern-input ${errors.registrationNumber ? 'is-invalid' : ''}`} placeholder="RC 1234567" value={form.registrationNumber} onChange={e => update('registrationNumber', e.target.value)} />
              {errors.registrationNumber && <div className="invalid-feedback">{errors.registrationNumber}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Sector</label>
              <select className="form-select" value={form.sector} onChange={e => update('sector', e.target.value)}>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="services">Services</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Country <span style={{ color: 'red' }}>*</span></label>
              <input className={`modern-input ${errors.country ? 'is-invalid' : ''}`} value={form.country} onChange={e => update('country', e.target.value)} />
              {errors.country && <div className="invalid-feedback">{errors.country}</div>}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">City <span style={{ color: 'red' }}>*</span></label>
              <input className={`modern-input ${errors.city ? 'is-invalid' : ''}`} value={form.city} onChange={e => update('city', e.target.value)} />
              {errors.city && <div className="invalid-feedback">{errors.city}</div>}
            </div>
            <div className="col-12">
              <label className="form-label">Address <span style={{ color: 'red' }}>*</span></label>
              <input className={`modern-input ${errors.address ? 'is-invalid' : ''}`} value={form.address} onChange={e => update('address', e.target.value)} />
              {errors.address && <div className="invalid-feedback">{errors.address}</div>}
            </div>
          </div>

          <div className="form-check mb-4">
            <input id="agree" className={`form-check-input ${errors.agree ? 'is-invalid' : ''}`} type="checkbox" checked={form.agree} onChange={e => update('agree', e.target.checked)} />
            <label htmlFor="agree" className="form-check-label" style={{ fontSize: 13 }}>I agree to the terms and privacy policy</label>
            {errors.agree && <div className="invalid-feedback d-block">{errors.agree}</div>}
          </div>

          <button
            className="btn-gradient-primary w-100"
            type="submit"
            disabled={loading}
            style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
            {loading ? 'Creating Account...' : 'Register Business Account'}
          </button>

          <p className="text-center mt-3" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account? <a href="#/login" style={{ color: 'var(--primary)' }}>Sign In</a>
          </p>
        </form>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  )
}
