import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

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
              &copy; {currentYear} Prove Ownership. All rights reserved.
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
