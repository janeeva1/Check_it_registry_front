import "./landing-v5.css";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const landingVersions = [
  { path: '/', label: 'Classic' },
  { path: '/landing/v1', label: 'Modern' },
  { path: '/landing/v2', label: 'Minimal' },
  { path: '/landing/v3', label: 'Premium' },
  { path: '/landing/v4', label: 'Enterprise' },
  { path: '/landing/v5', label: 'Stories' },
];
import {
  ShieldCheck, Search, ArrowRight, CheckCircle2, AlertTriangle,
  ChevronRight, Quote, Star, Smartphone, Laptop, Heart,
  Shield, Bell, MapPin, Clock, Fingerprint, Globe
} from "lucide-react";

const stories = [
  {
    icon: Clock,
    title: "6:47 AM — Lagos",
    headline: "Chidinma's phone was snatched at a bus stop in Surulere.",
    body: "Within minutes, she opened Prove Ownership and flagged her iPhone 14. The device was instantly locked in our database and an alert was sent to every partner agency and marketplace in Lagos.",
    result: "48 hours later, the device was flagged at a repair shop in Ikeja. LEA coordinated the recovery.",
    color: "#ef4444"
  },
  {
    icon: CheckCircle2,
    title: "2:15 PM — Abuja",
    headline: "Emeka wanted to sell his MacBook Air on Jiji.",
    body: "Before listing, he generated a Prove Ownership certificate. The buyer scanned the IMEI and saw verified ownership in under 2 seconds. The sale was completed with full confidence.",
    result: "The buyer left a 5-star review. The device transfer was recorded on-chain.",
    color: "#16a34a"
  },
  {
    icon: Shield,
    title: "11:30 PM — Port Harcourt",
    headline: "A school registered 400 student laptops on Prove Ownership.",
    body: "When 3 laptops went missing during exams, the IT admin used our bulk management dashboard to flag all three. Cross-carrier blacklisting rendered them unusable within hours.",
    result: "All 3 devices were recovered. Theft incidents dropped 74% the following semester.",
    color: "#2563eb"
  }
];

const testimonials = [
  { name: "Chidinma O.", role: "Student, University of Lagos", quote: "I never thought I'd see my phone again. Prove Ownership made it happen in 2 days.", rating: 5 },
  { name: "Emeka A.", role: "Freelance Developer", quote: "I sell devices regularly. The ownership certificate makes buyers trust me instantly.", rating: 5 },
  { name: "ACP Balogun", role: "NPF Cybercrime Unit", quote: "This platform has revolutionized how we handle stolen device cases. The data is instant and actionable.", rating: 5 },
  { name: "Funke I.", role: "IT Director, Lagos State University", quote: "We registered 2,400 laptops. The theft rate dropped 67% in one semester. This is the future.", rating: 5 },
];

const timeline = [
  { step: "Register", desc: "Snap a photo, enter IMEI. Takes 60 seconds.", icon: Smartphone },
  { step: "Verify", desc: "Your identity is cryptographically bound to the device.", icon: Fingerprint },
  { step: "Protect", desc: "Get instant alerts, certificates, and recovery support.", icon: Shield },
  { step: "Recover", desc: "If lost, we coordinate with LEA and block resale channels.", icon: MapPin },
];

export default function LandingV5() {
  const location = useLocation();
  const [imei, setImei] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";
  const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || "/api");

  const handleSearch = async () => {
    setSearchError(null);
    setSearchResult(null);
    if (!imei.trim()) return;
    try {
      setSearchLoading(true);
      const res = await fetch(`${API_URL}/public-check?imei=${encodeURIComponent(imei.trim())}`);
      if (!res.ok) throw new Error("Check failed");
      const data = await res.json();
      setSearchResult(data);
    } catch {
      setSearchError("Failed to verify device. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="v5-root">
      {/* Nav */}
      <nav className="v5-nav">
        <div className="v5-container v5-nav-inner">
          <Link to="/" className="v5-logo">Prove<span>Ownership</span></Link>
          <div className="v5-nav-links">
            <a href="#stories">Stories</a>
            <a href="#how">How It Works</a>
            <a href="#verify">Verify Device</a>
            <Link to="/login" className="v5-btn-text">Sign In</Link>
            <Link to="/register" className="v5-btn-green">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="v5-hero">
        <div className="v5-container">
          <div className="v5-hero-eyebrow">
            <Heart size={14} /> Trusted by 1,000+ device owners across Nigeria
          </div>
          <h1>Every device has<br />a <span className="v5-green">story.</span></h1>
          <p className="v5-hero-sub">
            We make sure yours has a happy ending. Register your devices, prove ownership instantly, and get them back if they're ever lost or stolen.
          </p>
          <div className="v5-hero-btns">
            <Link to="/register" className="v5-btn-green v5-btn-lg">
              Start Your Story <ArrowRight size={18} />
            </Link>
            <a href="#stories" className="v5-btn-outline v5-btn-lg">
              Read Real Stories
            </a>
          </div>
        </div>
      </section>

      {/* Story Cards */}
      <section id="stories" className="v5-section">
        <div className="v5-container">
          <div className="v5-section-label">Real Stories, Real People</div>
          <h2 className="v5-section-title">What happens when<br />devices go missing?</h2>
          <div className="v5-stories-grid">
            {stories.map((s, i) => (
              <div key={i} className="v5-story-card">
                <div className="v5-story-header" style={{ borderColor: s.color }}>
                  <div className="v5-story-icon" style={{ background: `${s.color}15`, color: s.color }}>
                    <s.icon size={20} />
                  </div>
                  <span className="v5-story-time" style={{ color: s.color }}>{s.title}</span>
                </div>
                <h3 className="v5-story-headline">{s.headline}</h3>
                <p className="v5-story-body">{s.body}</p>
                <div className="v5-story-result">
                  <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                  <span>{s.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="v5-section v5-section-dark">
        <div className="v5-container">
          <div className="v5-section-label v5-section-label-light">How It Works</div>
          <h2 className="v5-section-title v5-section-title-light">Four steps to<br /><span className="v5-green">total protection</span></h2>
          <div className="v5-timeline">
            {timeline.map((t, i) => (
              <div key={i} className="v5-timeline-item">
                <div className="v5-timeline-num">{i + 1}</div>
                <div className="v5-timeline-content">
                  <div className="v5-timeline-icon"><t.icon size={22} /></div>
                  <h3>{t.step}</h3>
                  <p>{t.desc}</p>
                </div>
                {i < timeline.length - 1 && <div className="v5-timeline-line"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Verification */}
      <section id="verify" className="v5-section">
        <div className="v5-container">
          <div className="v5-verify-box">
            <div className="v5-verify-content">
              <div className="v5-section-label">Instant Verification</div>
              <h2>Before you buy, <span className="v5-green">verify.</span></h2>
              <p>Enter an IMEI or Serial Number to instantly check if a device has been reported stolen or lost.</p>
            </div>
            <div className="v5-verify-action">
              <div className="v5-verify-input">
                <input
                  type="text"
                  placeholder="Enter IMEI or Serial Number"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} disabled={searchLoading}>
                  {searchLoading ? "..." : <><Search size={18} /> Check</>}
                </button>
              </div>
              {searchError && <p className="v5-verify-error">{searchError}</p>}
              {searchResult && (
                <div className={`v5-verify-result ${searchResult.status === 'clean' ? 'v5-result-ok' : 'v5-result-warn'}`}>
                  {searchResult.status === 'clean' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                  <div>
                    <strong>{searchResult.status === 'clean' ? 'Device Clear' : 'Device Flagged'}</strong>
                    <span>{searchResult.status === 'clean' ? 'No reports found.' : 'Reported stolen or lost.'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="v5-section v5-section-light">
        <div className="v5-container">
          <div className="v5-section-label">What People Say</div>
          <h2 className="v5-section-title">Trusted by thousands</h2>
          <div className="v5-testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="v5-testimonial-card">
                <div className="v5-testimonial-stars">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <Quote size={20} className="v5-quote-icon" />
                <p>"{t.quote}"</p>
                <div className="v5-testimonial-author">
                  <div className="v5-testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="v5-cta">
        <div className="v5-container">
          <h2>Don't wait for the worst.<br /><span className="v5-green">Protect your devices today.</span></h2>
          <p>Join 1,000+ Nigerians who already trust Prove Ownership to keep their devices safe.</p>
          <div className="v5-hero-btns" style={{ justifyContent: 'center' }}>
            <Link to="/register" className="v5-btn-green v5-btn-lg">
              Create Free Account <ChevronRight size={18} />
            </Link>
            <Link to="/search" className="v5-btn-outline v5-btn-lg">
              Check a Device
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="v5-footer">
        <div className="v5-container">
          <div className="v5-footer-grid">
            <div>
              <div className="v5-logo" style={{ marginBottom: 16 }}>Prove<span>Ownership</span></div>
              <p>Nigeria's device registry & recovery platform. Prove It. Own It. Protect It.</p>
            </div>
            <div>
              <strong>Platform</strong>
              <Link to="/search">Device Check</Link>
              <Link to="/marketplace">Marketplace</Link>
              <Link to="/found-device">Report Found</Link>
            </div>
            <div>
              <strong>Legal</strong>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/cookies">Cookie Policy</Link>
            </div>
            <div>
              <strong>Contact</strong>
              <p>admin@proveownership.com</p>
              <p style={{ marginTop: 8 }}>Lagos, Nigeria</p>
            </div>
          </div>
          <div className="v5-footer-bottom">
            &copy; {new Date().getFullYear()} Prove Ownership. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Version Switcher */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1040, display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
        border: '1px solid #e5e7eb', borderRadius: 12,
        padding: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <span style={{ fontSize: 12, color: '#9ca3af', padding: '0 10px', whiteSpace: 'nowrap', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>View:</span>
        {landingVersions.map((v) => (
          <Link
            key={v.path}
            to={v.path}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
              background: location.pathname === v.path ? '#16a34a' : 'transparent',
              color: location.pathname === v.path ? 'white' : '#6b7280',
            }}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
