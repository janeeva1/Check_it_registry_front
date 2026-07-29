import "./landing-v4.css";
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
  ShieldCheck, Search, ArrowRight, Check, Building2, Users,
  BarChart3, Globe, Lock, Shield, AlertTriangle,
  CheckCircle2, ChevronRight, Mail, ArrowUpRight
} from "lucide-react";

const enterpriseFeatures = [
  {
    icon: Building2,
    title: "Enterprise Device Fleet",
    desc: "Register, track, and manage hundreds of corporate devices from a single admin dashboard.",
    tag: "For Organizations"
  },
  {
    icon: BarChart3,
    title: "Compliance Reporting",
    desc: "Generate device audit trails and compliance reports for regulatory requirements and internal policy.",
    tag: "For IT Teams"
  },
  {
    icon: Users,
    title: "Multi-User Management",
    desc: "Assign devices to employees, manage permissions, and track device assignments in real time.",
    tag: "For HR & Ops"
  },
  {
    icon: Shield,
    title: "Theft Deterrence Network",
    desc: "When a device is flagged, our network of partner agencies and marketplaces blocks resale instantly.",
    tag: "For Security"
  },
  {
    icon: Globe,
    title: "Nationwide LEA Integration",
    desc: "Direct integration with law enforcement agencies across all 36 states for rapid recovery coordination.",
    tag: "For Law Enforcement"
  },
  {
    icon: Lock,
    title: "Bank-Grade Encryption",
    desc: "All ownership records are encrypted at rest and in transit with AES-256 and TLS 1.3 protocols.",
    tag: "For Compliance"
  },
];

const partners = [
  "Nigeria Police Force", "EFCC", "NCC", "CBN", "NIMC", "NIS"
];

const caseStudies = [
  {
    title: "Lagos State University",
    stat: "2,400+",
    desc: "devices registered across campus, reducing theft by 67% in the first semester.",
    color: "#22c55e"
  },
  {
    title: "TechHub Nigeria",
    stat: "890+",
    desc: "corporate devices managed with full audit trails and instant verification.",
    color: "#3b82f6"
  },
  {
    title: "NPF Cybercrime Unit",
    stat: "1,200+",
    desc: "stolen devices flagged and 340+ recovered through our LEA portal.",
    color: "#f59e0b"
  },
];

const pricingPlans = [
  {
    name: "Individual",
    price: "Free",
    period: "",
    desc: "Perfect for personal device protection",
    features: ["5 device registrations", "Basic ownership certificate", "Stolen device alerts", "Public verification"],
    cta: "Get Started Free",
    highlighted: false
  },
  {
    name: "Business",
    price: "\u20A65,000",
    period: "/month",
    desc: "For small to medium businesses",
    features: ["Unlimited devices", "Admin dashboard", "Multi-user access", "Priority LEA alerts", "Compliance reports", "API access"],
    cta: "Start Free Trial",
    highlighted: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large organizations and government",
    features: ["Everything in Business", "Dedicated account manager", "Custom integrations", "SLA guarantee", "On-premise option", "White-label available"],
    cta: "Contact Sales",
    highlighted: false
  }
];

export default function LandingV4() {
  const [imei, setImei] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const location = useLocation();

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
    <div className="v4-root">
      {/* Top Bar */}
      <div className="v4-topbar">
        <div className="v4-container">
          <span>Now serving organizations across all 36 states + FCT</span>
          <div className="v4-topbar-links">
            <a href="mailto:admin@proveownership.com"><Mail size={14} /> admin@proveownership.com</a>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="v4-nav">
        <div className="v4-container v4-nav-inner">
          <Link to="/" className="v4-logo">
            <ShieldCheck size={28} />
            <span>Prove Ownership</span>
          </Link>
          <div className="v4-nav-menu">
            <a href="#features">Features</a>
            <a href="#enterprise">Enterprise</a>
            <a href="#pricing">Pricing</a>
            <a href="#search-section">Device Check</a>
          </div>
          <div className="v4-nav-actions">
            <Link to="/login" className="v4-btn-ghost">Sign In</Link>
            <Link to="/register" className="v4-btn-solid">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="v4-hero">
        <div className="v4-container">
          <div className="v4-hero-badge">Trusted by 50+ organizations nationwide</div>
          <h1>The Operating System for<br /><span className="v4-text-accent">Device Ownership</span></h1>
          <p className="v4-hero-sub">
            Prove Ownership is Nigeria's most trusted device registry platform. We help individuals, businesses, and government agencies register, verify, and recover devices through a secure, auditable system integrated with law enforcement.
          </p>
          <div className="v4-hero-btns">
            <Link to="/register" className="v4-btn-solid v4-btn-lg">
              Start Free <ArrowRight size={18} />
            </Link>
            <a href="#enterprise" className="v4-btn-ghost v4-btn-lg">
              Enterprise Demo <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="v4-hero-proof">
            <div className="v4-proof-avatars">
              {["AO", "DA", "GI", "JM", "MA"].map((init, i) => (
                <div key={i} className="v4-proof-avatar">{init}</div>
              ))}
            </div>
            <div>
              <div className="v4-proof-stars">{"★★★★★"}</div>
              <div className="v4-proof-text">Rated 4.9/5 by 200+ verified users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="v4-stats-bar">
        <div className="v4-container v4-stats-inner">
          {[
            { n: "1,000+", l: "Devices Registered" },
            { n: "50+", l: "Organizations" },
            { n: "2,000+", l: "Verifications" },
            { n: "99.9%", l: "Uptime" },
          ].map((s, i) => (
            <div key={i} className="v4-stat-item">
              <div className="v4-stat-num">{s.n}</div>
              <div className="v4-stat-label">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="v4-section">
        <div className="v4-container">
          <div className="v4-section-header">
            <span className="v4-section-tag">Platform Capabilities</span>
            <h2>Everything you need to<br /><span className="v4-text-accent">protect your devices</span></h2>
            <p>From individual phone registration to enterprise fleet management, we've built every tool you need.</p>
          </div>
          <div className="v4-features-grid">
            {enterpriseFeatures.map((f, i) => (
              <div key={i} className="v4-feature-card">
                <div className="v4-feature-top">
                  <div className="v4-feature-icon"><f.icon size={22} /></div>
                  <span className="v4-feature-tag">{f.tag}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise / Partners */}
      <section id="enterprise" className="v4-section v4-section-alt">
        <div className="v4-container">
          <div className="v4-section-header">
            <span className="v4-section-tag">Enterprise & Government</span>
            <h2>Built for <span className="v4-text-accent">scale</span></h2>
            <p>Trusted by leading organizations across Nigeria for device security and compliance.</p>
          </div>
          <div className="v4-partners-grid">
            {partners.map((p, i) => (
              <div key={i} className="v4-partner-card">{p}</div>
            ))}
          </div>
          <div className="v4-case-studies">
            {caseStudies.map((c, i) => (
              <div key={i} className="v4-case-card">
                <div className="v4-case-stat" style={{ color: c.color }}>{c.stat}</div>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Check */}
      <section id="search-section" className="v4-section">
        <div className="v4-container">
          <div className="v4-section-header">
            <span className="v4-section-tag">Instant Verification</span>
            <h2>Check any device <span className="v4-text-accent">before you buy</span></h2>
            <p>Enter an IMEI or Serial Number to instantly check if a device has been reported stolen or lost.</p>
          </div>
          <div className="v4-search-box">
            <div className="v4-search-input-group">
              <Search size={20} className="v4-search-icon" />
              <input
                type="text"
                placeholder="Enter IMEI or Serial Number"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? "Checking..." : "Verify Now"}
              </button>
            </div>
            {searchError && <p className="v4-search-error">{searchError}</p>}
            {searchResult && (
              <div className={`v4-search-result ${searchResult.status === 'clean' ? 'v4-result-ok' : 'v4-result-warn'}`}>
                <div className="v4-result-row">
                  {searchResult.status === 'clean' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                  <strong>{searchResult.status === 'clean' ? 'Device Clear' : 'Device Flagged'}</strong>
                </div>
                <p>{searchResult.status === 'clean' ? 'No reports found for this device.' : 'This device has been reported. Exercise caution.'}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="v4-section v4-section-alt">
        <div className="v4-container">
          <div className="v4-section-header">
            <span className="v4-section-tag">Pricing</span>
            <h2>Simple, transparent <span className="v4-text-accent">pricing</span></h2>
            <p>Start free. Upgrade when you need more power.</p>
          </div>
          <div className="v4-pricing-grid">
            {pricingPlans.map((p, i) => (
              <div key={i} className={`v4-pricing-card ${p.highlighted ? 'v4-pricing-highlighted' : ''}`}>
                {p.highlighted && <div className="v4-pricing-badge">Most Popular</div>}
                <h3>{p.name}</h3>
                <div className="v4-pricing-price">
                  <span className="v4-price-amount">{p.price}</span>
                  {p.period && <span className="v4-price-period">{p.period}</span>}
                </div>
                <p className="v4-pricing-desc">{p.desc}</p>
                <ul className="v4-pricing-features">
                  {p.features.map((f, j) => (
                    <li key={j}><Check size={16} /> {f}</li>
                  ))}
                </ul>
                <Link to="/register" className={p.highlighted ? 'v4-btn-solid v4-btn-full' : 'v4-btn-outline v4-btn-full'}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="v4-cta-section">
        <div className="v4-container">
          <h2>Ready to secure your devices?</h2>
          <p>Join thousands of individuals and organizations already using Prove Ownership.</p>
          <div className="v4-hero-btns" style={{ justifyContent: 'center' }}>
            <Link to="/register" className="v4-btn-solid v4-btn-lg v4-btn-white">
              Create Free Account <ChevronRight size={18} />
            </Link>
            <Link to="/search" className="v4-btn-ghost v4-btn-lg v4-btn-white">
              Public Device Check
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="v4-footer">
        <div className="v4-container">
          <div className="v4-footer-grid">
            <div className="v4-footer-brand">
              <div className="v4-logo" style={{ marginBottom: 16 }}>
                <ShieldCheck size={24} />
                <span>Prove Ownership</span>
              </div>
              <p>Nigeria's most trusted device registry and recovery platform.</p>
            </div>
            <div>
              <strong>Platform</strong>
              <Link to="/search">Device Check</Link>
              <Link to="/marketplace">Marketplace</Link>
              <Link to="/found-device">Report Found</Link>
              <a href="#pricing">Pricing</a>
            </div>
            <div>
              <strong>Company</strong>
              <a href="#enterprise">Enterprise</a>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/cookies">Cookies</Link>
            </div>
            <div>
              <strong>Contact</strong>
              <a href="mailto:admin@proveownership.com">admin@proveownership.com</a>
              <p style={{ marginTop: 8, color: '#64748b', fontSize: 14 }}>Lagos, Nigeria</p>
            </div>
          </div>
          <div className="v4-footer-bottom">
            &copy; {new Date().getFullYear()} Prove Ownership. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Version Switcher */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1040, display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
        border: '1px solid #e2e8f0', borderRadius: 12,
        padding: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        <span style={{ fontSize: 12, color: '#94a3b8', padding: '0 10px', whiteSpace: 'nowrap', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>View:</span>
        {landingVersions.map((v) => (
          <Link
            key={v.path}
            to={v.path}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
              background: location.pathname === v.path ? '#16a34a' : 'transparent',
              color: location.pathname === v.path ? 'white' : '#64748b',
            }}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
