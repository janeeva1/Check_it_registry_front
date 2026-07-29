import "./landing-v3.css";
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
  ShieldCheck, Search, Globe,
  ArrowRight, CheckCircle2, Smartphone, Laptop,
  Fingerprint, AlertTriangle,
  Camera, Watch, Gamepad2, Tablet, ChevronRight
} from "lucide-react";

const deviceTypes = [
  { icon: Smartphone, label: "Smartphones" },
  { icon: Laptop, label: "Laptops" },
  { icon: Camera, label: "Cameras" },
  { icon: Watch, label: "Smartwatches" },
  { icon: Gamepad2, label: "Gaming Consoles" },
  { icon: Tablet, label: "Tablets" },
];

const features = [
  { icon: ShieldCheck, title: "Instant Proof", desc: "Generate verifiable ownership certificates in minutes." },
  { icon: Fingerprint, title: "Blockchain Security", desc: "Immutable and trusted ownership records." },
  { icon: Globe, title: "Global Verification", desc: "Verify ownership anywhere in the world." },
  { icon: Search, title: "Lost Device Recovery", desc: "Increase the chances of recovering your assets." },
];

const steps = [
  { n: "01", title: "Register", desc: "Add your device details — takes less than 60 seconds." },
  { n: "02", title: "Verify", desc: "Our system generates a unique ownership record." },
  { n: "03", title: "Get Certified", desc: "Receive your digital certificate instantly." },
  { n: "04", title: "Prove Anytime", desc: "Present proof whenever and wherever needed." },
];

const audiences = [
  "Students", "Businesses", "Developers", "Photographers", "Schools", "Government Agencies"
];

const stats = [
  { value: "1,000+", label: "Devices Registered" },
  { value: "500+", label: "Certificates Issued" },
  { value: "2,000+", label: "Verifications" },
  { value: "50+", label: "Organizations" },
];

export default function LandingV3() {
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
    <div className="v3-root">
      {/* Nav */}
      <nav className="v3-nav">
        <div className="v3-container v3-nav-inner">
          <Link to="/" className="v3-logo">Prove<span>Ownership</span></Link>
          <div className="v3-nav-tagline">Prove It. Own It. Protect It.</div>
          <div className="v3-nav-links">
            <Link to="/login" className="v3-btn-outline">Sign In</Link>
            <Link to="/register" className="v3-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="v3-hero">
        <div className="v3-container v3-hero-grid">
          <div className="v3-hero-content">
            <h1>LOST YOUR DEVICE?<br /><span className="v3-blue">PROVE IT'S YOURS.</span></h1>
            <p className="v3-lead">
              Register phones, laptops, cameras, tablets and other valuable assets with globally verifiable digital ownership certificates.
            </p>
            <p className="v3-badges">Secure &bull; Tamper-Proof &bull; Globally Verifiable &bull; Built for Everyone</p>
            <div className="v3-hero-btns">
              <Link to="/register" className="v3-btn-primary v3-btn-lg">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/search" className="v3-btn-outline v3-btn-lg">
                Check a Device
              </Link>
            </div>
          </div>
          <div className="v3-hero-devices">
            <div className="v3-glow"></div>
            <div className="v3-device-card v3-card-laptop">
              <Laptop size={32} />
              <span>Interactive Dashboard</span>
            </div>
            <div className="v3-device-card v3-card-phone">
              <Smartphone size={28} />
              <span>Digital Certificate</span>
            </div>
            <div className="v3-device-card v3-card-mac">
              <Laptop size={20} />
              <span>MacBook</span>
            </div>
            <div className="v3-device-card v3-card-tablet">
              <Tablet size={20} />
              <span>iPad</span>
            </div>
            <div className="v3-device-card v3-card-camera">
              <Camera size={20} />
              <span>Camera</span>
            </div>
            <div className="v3-device-card v3-card-console">
              <Gamepad2 size={20} />
              <span>PS5</span>
            </div>
            <div className="v3-device-card v3-card-watch">
              <Watch size={16} />
            </div>
          </div>
        </div>
      </section>

      {/* Devices Section */}
      <section className="v3-section">
        <div className="v3-container">
          <h2>Protect What Matters Most</h2>
          <div className="v3-grid-6">
            {deviceTypes.map((d, i) => (
              <div key={i} className="v3-feature-card v3-device-type">
                <d.icon size={28} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="v3-section">
        <div className="v3-container">
          <h2>Why Choose <span className="v3-blue">ProveOwnership</span>?</h2>
          <div className="v3-grid-4">
            {features.map((f, i) => (
              <div key={i} className="v3-feature-card">
                <div className="v3-feature-icon"><f.icon size={28} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="v3-section">
        <div className="v3-container">
          <h2>How It Works</h2>
          <div className="v3-grid-4">
            {steps.map((s, i) => (
              <div key={i} className="v3-feature-card v3-step">
                <div className="v3-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Check */}
      <section className="v3-section">
        <div className="v3-container">
          <h2>Check a Device <span className="v3-blue">Before You Buy</span></h2>
          <p className="v3-lead" style={{ textAlign: 'center', marginBottom: 32 }}>
            Enter an IMEI or Serial Number to check if a device has been reported stolen.
          </p>
          <div className="v3-search-bar">
            <input
              type="text"
              placeholder="Enter IMEI or Serial Number"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? "Checking..." : "Check Now"}
            </button>
          </div>
          {searchError && <p className="v3-search-error">{searchError}</p>}
          {searchResult && (
            <div className={`v3-search-result ${searchResult.status === 'clean' ? 'v3-result-clean' : 'v3-result-flagged'}`}>
              <div className="v3-result-header">
                {searchResult.status === 'clean' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                <h3>{searchResult.status === 'clean' ? 'Device Clear' : 'Device Flagged'}</h3>
              </div>
              <p>{searchResult.message || (searchResult.status === 'clean' ? 'This device has not been reported stolen or lost.' : 'This device has been reported. Proceed with caution.')}</p>
              {searchResult.device && (
                <div className="v3-result-details">
                  <span>{searchResult.device.brand} {searchResult.device.model}</span>
                  <span>{searchResult.device.category}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Perfect For */}
      <section className="v3-section">
        <div className="v3-container">
          <h2>Perfect For</h2>
          <div className="v3-grid-6">
            {audiences.map((a, i) => (
              <div key={i} className="v3-feature-card v3-audience">{a}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="v3-section">
        <div className="v3-container">
          <h2>Platform Statistics</h2>
          <div className="v3-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="v3-stat">
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="v3-cta">
        <div className="v3-container">
          <h2>DON'T JUST OWN IT — <span className="v3-blue">PROVE IT.</span></h2>
          <p>Join the future of ownership verification and protect what matters most.</p>
          <div className="v3-hero-btns" style={{ justifyContent: 'center' }}>
            <Link to="/register" className="v3-btn-primary v3-btn-lg">
              Create Free Account <ChevronRight size={18} />
            </Link>
            <Link to="/search" className="v3-btn-outline v3-btn-lg">
              Check a Device
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="v3-footer">
        <div className="v3-container">
          <div className="v3-footer-grid">
            <div>
              <strong>ProveOwnership</strong>
              <p>Prove It. Own It. Protect It.</p>
            </div>
            <div>
              <strong>Product</strong>
              <Link to="/search">Public Search</Link>
              <Link to="/marketplace">Marketplace</Link>
              <Link to="/found-device">Report Found</Link>
            </div>
            <div>
              <strong>Company</strong>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/cookies">Cookies</Link>
            </div>
            <div>
              <strong>Contact</strong>
              <p>admin@proveownership.com</p>
            </div>
          </div>
          <div className="v3-footer-bottom">
            &copy; {new Date().getFullYear()} Prove Ownership. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Version Switcher */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1040, display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(8,19,39,0.9)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
        padding: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <span style={{ fontSize: 12, color: '#64748b', padding: '0 10px', whiteSpace: 'nowrap', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>View:</span>
        {landingVersions.map((v) => (
          <Link
            key={v.path}
            to={v.path}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
              background: location.pathname === v.path ? '#2563eb' : 'transparent',
              color: location.pathname === v.path ? 'white' : '#94a3b8',
            }}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
