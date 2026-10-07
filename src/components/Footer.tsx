import { Link } from 'react-router-dom'
import { Shield, Building2, MapPin, Mail, Phone, UserSquare2 } from 'lucide-react'
import { companyInfo } from '../lib/companyInfo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      background: 'var(--bg-primary)',
      padding: '32px 0',
      marginTop: 'auto',
    }}>
      <div className="container" style={{ maxWidth: 1200 }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: 'var(--primary-600)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Prove Ownership</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              &copy; {currentYear} {companyInfo.name} &mdash; {companyInfo.product}. All rights reserved.
            </span>
          </div>

          {/* Policy Links */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link
              to="/terms"
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-600)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-600)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Privacy Policy
            </Link>
            <Link
              to="/cookies"
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-600)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Cookie Policy
            </Link>
            <a
              href="mailto:support@proveownership.com"
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-600)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Contact
            </a>
          </div>
        </div>

        {/* Company / Owner / Contact Information */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px 40px',
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 220 }}>
            <Building2 size={15} style={{ color: 'var(--primary-600)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{companyInfo.name}</div>
              <div style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserSquare2 size={13} style={{ flexShrink: 0 }} />
                {companyInfo.owner} &mdash; {companyInfo.ownerTitle}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 220 }}>
            <MapPin size={15} style={{ color: 'var(--primary-600)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-tertiary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Operational Address</div>
              {companyInfo.address}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 200 }}>
            <Mail size={15} style={{ color: 'var(--primary-600)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-tertiary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Email</div>
              {companyInfo.emails.map((email) => (
                <div key={email}>
                  <a href={`mailto:${email}`} style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-600)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >{email}</a>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 180 }}>
            <Phone size={15} style={{ color: 'var(--primary-600)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-tertiary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number</div>
              {companyInfo.phones.map((phone) => (
                <div key={phone}>
                  <a href={`tel:${phone}`} style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-600)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >{phone}</a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border-color)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          lineHeight: 1.6,
          textAlign: 'center',
        }}>
          Prove Ownership is a device registry and notification platform. We do not physically recover, track, or locate devices. Use of this platform does not guarantee device recovery.{' '}
          <Link to="/terms" style={{ color: 'var(--text-tertiary)', textDecoration: 'underline' }}>See Terms of Service</Link> for full disclaimers.
        </div>
      </div>
    </footer>
  )
}
