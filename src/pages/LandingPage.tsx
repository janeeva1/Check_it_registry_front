// Public home page: one promise, one search box, three steps. Nothing that
// isn't true about the service.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, ShieldCheck, AlertTriangle, ArrowRightLeft, Smartphone, Laptop, Car, Bike, Watch, Tv, Gem, Mail, Phone, MapPin } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../lib/apiClient'
import { companyInfo } from '../lib/companyInfo'

const STEPS = [
  { icon: Plus, title: 'Register', text: 'Add your phone, laptop, car or anything valuable with its IMEI, serial or VIN.' },
  { icon: Search, title: 'Check before you buy', text: 'Enter the number of any item and see if it is reported stolen, lost or claimed.' },
  { icon: AlertTriangle, title: 'Report if stolen', text: 'Mark it stolen in one step. Anyone who checks it is warned, and you are told where it was checked.' },
]

const TYPES = [
  { icon: Smartphone, label: 'Phones' }, { icon: Laptop, label: 'Laptops' }, { icon: Car, label: 'Cars' },
  { icon: Bike, label: 'Motorcycles' }, { icon: Watch, label: 'Watches' }, { icon: Tv, label: 'Electronics' }, { icon: Gem, label: 'Jewellery' },
]

export default function LandingPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [stats, setStats] = useState<{ devices: number; users: number } | null>(null)
  const [testimonials, setTestimonials] = useState<any[]>([])

  useEffect(() => {
    ;(apiClient as any).publicStats?.()
      .then((d: any) => setStats({ devices: Number(d?.devices) || 0, users: Number(d?.users) || 0 }))
      .catch(() => {})
    const API = import.meta.env.VITE_API_URL || '/api'
    fetch(`${API}/landing-content`).then((r) => (r.ok ? r.json() : null)).then((d) => setTestimonials(d?.testimonials || [])).catch(() => {})
  }, [])

  // Checks are for signed-in users: go to the check page, via login if needed
  const check = (e: React.FormEvent) => {
    e.preventDefault()
    const v = identifier.trim()
    const target = v ? `/device-check?${/^\d{14,17}$/.test(v) ? 'imei' : 'serial'}=${encodeURIComponent(v)}` : '/device-check'
    if (user) { navigate(target); return }
    try { sessionStorage.setItem('post_login_redirect', target) } catch { /* storage unavailable */ }
    navigate('/login')
  }

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <main className="po-landing">
        <section className="po-hero">
          <h1>Know it's not stolen.<br /><span>Prove it's yours.</span></h1>
          <p>Register what you own, check items before you buy, and warn buyers if something of yours is stolen.</p>
          <form className="po-hero-search" onSubmit={check} role="search">
            <Search size={20} aria-hidden="true" />
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter IMEI, serial number or VIN" aria-label="IMEI, serial number or VIN" />
            <button type="submit" className="po-btn po-btn-primary">Check</button>
          </form>
          <p className="po-hero-note">
            Free to register. <Link to={user ? '/register-device' : '/register'}>Create an account</Link>
            {stats && stats.devices > 0 && <> · {stats.devices.toLocaleString()} items registered</>}
          </p>
        </section>

        <section className="po-land-section">
          <h2>How it works</h2>
          <div className="po-steps-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="po-step-card">
                <span className="po-step-num">{i + 1}</span>
                <s.icon size={26} aria-hidden="true" />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="po-land-section">
          <h2>Works for what you own</h2>
          <ul className="po-type-row">
            {TYPES.map((t) => <li key={t.label}><t.icon size={22} aria-hidden="true" /><span>{t.label}</span></li>)}
          </ul>
        </section>

        <section className="po-land-section po-split">
          <div>
            <ShieldCheck size={28} aria-hidden="true" />
            <h3>Verified owners</h3>
            <p>Send a receipt or papers once. When our team has checked them, buyers see you as the verified owner.</p>
          </div>
          <div>
            <ArrowRightLeft size={28} aria-hidden="true" />
            <h3>Safe hand-over</h3>
            <p>Selling? Transfer the item to the buyer in the app, so the record moves to them when they pay.</p>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="po-land-section">
            <h2>What people say</h2>
            <div className="po-quotes">
              {testimonials.slice(0, 3).map((t, i) => (
                <figure key={i} className="po-quote-card">
                  <blockquote>“{t.content || t.quote}”</blockquote>
                  <figcaption><strong>{t.name}</strong>{t.location ? ` · ${t.location}` : ''}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="po-cta">
          <h2>Protect your things today</h2>
          <p>It takes about two minutes.</p>
          <Link to={user ? '/register-device' : '/register'} className="po-btn po-btn-primary">Register an item</Link>
        </section>
      </main>

      <footer className="po-land-footer" id="contact">
        <div className="po-land-footer-inner">
          <div>
            <div className="po-land-brand"><img src="/logo-mark.png" alt="" height={24} /> Prove Ownership</div>
            <p>{companyInfo.name}</p>
          </div>
          <ul>
            <li><MapPin size={16} aria-hidden="true" /> {companyInfo.address}</li>
            <li><Mail size={16} aria-hidden="true" /> <a href={`mailto:${companyInfo.emails[0]}`}>{companyInfo.emails[0]}</a></li>
            <li><Phone size={16} aria-hidden="true" /> {companyInfo.phones.map((p, i) => <span key={p}>{i ? ', ' : ''}<a href={`tel:${p}`}>{p}</a></span>)}</li>
          </ul>
          <nav aria-label="Footer">
            <Link to="/help">Help</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/cookies">Cookies</Link>
          </nav>
        </div>
        <p className="po-land-legal">© {new Date().getFullYear()} {companyInfo.name}. Prove Ownership is a registry and alert service; it does not physically track or recover items.</p>
      </footer>
    </>
  )
}
