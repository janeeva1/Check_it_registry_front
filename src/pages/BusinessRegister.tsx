import React, { useState } from 'react'
import { Layout } from '../components/Layout'

export default function BusinessRegister() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    registrationNumber: '',
    sector: 'retail',
    agree: false,
  })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitted, setSubmitted] = useState(false)

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.name) e.name = 'Business name is required'
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone) e.phone = 'Phone is required'
    if (!form.country) e.country = 'Country is required'
    if (!form.city) e.city = 'City is required'
    if (!form.address) e.address = 'Address is required'
    if (!form.registrationNumber) e.registrationNumber = 'Registration number is required'
    if (!form.agree) e.agree = 'You must accept terms'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitted(true)
    setTimeout(() => alert('Business registration submitted!'), 300)
  }

  return (
    <Layout>
      <div className="container py-4">
        <h2 className="fw-bold mb-3">Business Registration</h2>
        {!submitted ? (
          <form onSubmit={onSubmit} className="modern-card p-3">
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}><span style={{ color: 'red' }}>*</span> Required fields</div>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Business Name <span style={{ color: 'red' }}>*</span></label>
                <input className={`modern-input ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={e => update('name', e.target.value)} />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Registration Number <span style={{ color: 'red' }}>*</span></label>
                <input className={`modern-input ${errors.registrationNumber ? 'is-invalid' : ''}`} value={form.registrationNumber} onChange={e => update('registrationNumber', e.target.value)} />
                {errors.registrationNumber && <div className="invalid-feedback">{errors.registrationNumber}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Email <span style={{ color: 'red' }}>*</span></label>
                <input type="email" className={`modern-input ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={e => update('email', e.target.value)} />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Phone <span style={{ color: 'red' }}>*</span></label>
                <input className={`modern-input ${errors.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={e => update('phone', e.target.value)} />
                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
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

              <div className="col-12 col-md-6">
                <label className="form-label">Sector <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span></label>
                <select className="form-select" value={form.sector} onChange={e => update('sector', e.target.value)}>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input id="agree" className={`form-check-input ${errors.agree ? 'is-invalid' : ''}`} type="checkbox" checked={form.agree} onChange={e => update('agree', e.target.checked)} />
                  <label htmlFor="agree" className="form-check-label">I agree to the terms and privacy policy</label>
                  {errors.agree && <div className="invalid-feedback d-block">{errors.agree}</div>}
                </div>
              </div>

              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-primary" type="submit">Submit Registration</button>
              </div>
            </div>
          </form>
        ) : (
          <div className="modern-card p-4 text-center">
            <div className="mb-2">✅</div>
            <h5>Registration Submitted</h5>
            <p className="text-secondary">We will review your information and notify you via email.</p>
            <a href="#/business/dashboard" className="btn btn-outline-primary">Back to Dashboard</a>
          </div>
        )}
      </div>
    </Layout>
  )
}