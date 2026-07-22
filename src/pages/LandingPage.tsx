import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Smartphone,
  RefreshCw,
  CheckCircle,
  Search,
  Lock,
  Users,
  AlertTriangle,
  ArrowRight,
  Globe,
  Database,
  Cpu,
  X,
  Star,
  ChevronRight,
  BarChart3,
  Fingerprint,
  BellRing,
  Phone,
  Laptop,
  Tablet,
  Award,
  Zap,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Building2,
  GraduationCap,
  Heart,
  Quote
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import Navbar from '../components/Navbar';
import TechParticles from '../components/TechParticles';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    users: 0,
    devices: 0,
    verified_devices: 0,
    recovered_devices: 0
  });

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchImei, setSearchImei] = useState('');
  const [searchSerial, setSearchSerial] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchCheck = async () => {
    setSearchError(null);
    setSearchResult(null);
    if (!searchImei && !searchSerial) {
      setSearchError('Please enter IMEI or Serial Number');
      return;
    }
    try {
      setSearchLoading(true);
      const params = new URLSearchParams();
      if (searchImei) params.set('imei', searchImei);
      if (searchSerial) params.set('serial', searchSerial);
      const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';
      const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api');
      const res = await fetch(`${API_URL}/public-check?${params.toString()}`);
      if (!res.ok) throw new Error('Check failed');
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setSearchError('Failed to verify device. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const CACHE_KEY = 'landing_content_cache';
    const CACHE_TTL = 3600000; // 1 hour

    const getCached = () => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        if (Date.now() - cached.timestamp > CACHE_TTL) {
          localStorage.removeItem(CACHE_KEY);
          return null;
        }
        return cached.data;
      } catch { return null }
    };

    const setCached = (data: any) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      } catch { /* localStorage quota may be exceeded */ }
    };

    const cached = getCached();
    if (cached) {
      setTeamMembers(cached.team || []);
      setTestimonials(cached.testimonials || []);
    }

    const fetchLandingContent = async () => {
      try {
        const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';
        const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api');
        const res = await fetch(`${API_URL}/landing-content`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setTeamMembers(data.team || []);
            setTestimonials(data.testimonials || []);
            setCached(data);
          }
        }
      } catch (err) {
        console.error('Failed to load landing content', err);
      }
    };
    fetchLandingContent();

    const fetchStats = async () => {
      try {
        const data = await (apiClient as any).publicStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats', error);
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      icon: Database,
      title: "Your Digital Vault",
      desc: "We keep a safe, permanent record of your personal devices linked directly to you.",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: ShieldCheck,
      title: "Prove It's Yours",
      desc: "Selling your phone? Show buyers it's legally yours with instant, trusted verification.",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: BellRing,
      title: "Find Missing Items",
      desc: "If you lose something, we instantly notify the police and block it from being resold.",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      icon: Fingerprint,
      title: "Anti-Theft Shield",
      desc: "Your devices are cryptographically tied to your identity, making theft pointless.",
      gradient: "from-violet-500 to-purple-600"
    },
    {
      icon: BarChart3,
      title: "Real-Time Intelligence",
      desc: "Get alerts about stolen devices in your area and stay ahead of the market.",
      gradient: "from-rose-500 to-pink-600"
    },
    {
      icon: Globe,
      title: "Nationwide Coverage",
      desc: "Integrated with law enforcement databases across Nigeria for faster recovery.",
      gradient: "from-cyan-500 to-sky-600"
    }
  ];

  const displayTeam = teamMembers;
  const displayTestimonials = testimonials;

  return (
    <>
      {/* Navbar rendered outside the landing-page div to prevent overflow clipping */}
      <Navbar user={user} onLogout={logout} />

      {/* Landing page version switcher */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1040, display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)', borderRadius: 12,
        padding: '6px', boxShadow: 'var(--glass-shadow)'
      }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', padding: '0 10px', whiteSpace: 'nowrap', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>View:</span>
        {[
          { path: '/', label: 'Classic' },
          { path: '/landing/v1', label: 'Modern' },
          { path: '/landing/v2', label: 'Minimal' },
          { path: '/landing/v3', label: 'Premium' },
          { path: '/landing/v4', label: 'Enterprise' },
          { path: '/landing/v5', label: 'Stories' },
        ].map((v) => (
          <Link
            key={v.path}
            to={v.path}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 'var(--text-sm)', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
              background: location.pathname === v.path ? 'var(--primary-600)' : 'transparent',
              color: location.pathname === v.path ? 'white' : 'var(--text-secondary)',
            }}
          >
            {v.label}
          </Link>
        ))}
      </div>
      <div className="landing-page" style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
        <TechParticles />

      {/* ===================== HERO SECTION ===================== */}
      <section className="position-relative overflow-hidden" style={{ paddingTop: 'calc(64px + 2rem)' }}>
        {/* Background Image */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ zIndex: 0 }}>
          <div className="w-100 h-100" style={{
            backgroundImage: `url('/images/hero-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4
          }}></div>
          {/* Subtle gradient overlay to ensure text readability */}
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{
            background: 'linear-gradient(to bottom, var(--bg-secondary) 0%, transparent 40%, var(--bg-secondary) 100%)'
          }}></div>
        </div>

        {/* Gradient orbs */}
        <div className="position-absolute rounded-circle" style={{
          zIndex: 0,
          width: '500px', height: '500px',
          top: '-15%', right: '-10%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>
        <div className="position-absolute rounded-circle" style={{
          zIndex: 0,
          width: '400px', height: '400px',
          bottom: '-10%', left: '-5%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>

        <div className="container px-4 position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-5 min-vh-75">
            <div className="col-lg-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill mb-4 fw-semibold" style={{
                  fontSize: 'var(--text-sm)',
                  background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(22,163,74,0.05))',
                  border: '1px solid rgba(22,163,74,0.15)',
                  color: 'var(--primary-600)'
                }}>
                  <span className="d-inline-block rounded-circle bg-primary" style={{ width: 8, height: 8 }}></span>
                  Now LIVE in Nigeria
                </div>

                <h1 className="fw-extrabold lh-1 mb-4" style={{
                  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                  letterSpacing: 'var(--tracking-tight)',
                  color: 'var(--text-primary)'
                }}>
                  Protect Your{' '}
                  <span className="text-gradient">Devices</span>
                  <br />
                  Today
                </h1>

                <p className="lead mb-5" style={{
                  fontSize: 'clamp(1.05rem, 2vw, 1.2rem)',
                  color: 'var(--text-secondary)',
                  maxWidth: '540px',
                  lineHeight: 'var(--leading-relaxed)'
                }}>
                  Every day, thousands of phones and laptops go missing. We help you secure yours before it's too late. Register your gadgets, prove you own them, and get them back faster if they're ever lost.
                </p>

                <div className="d-flex flex-column flex-sm-row gap-3">
                  {user ? (
                    <Link to="/dashboard" className="btn btn-lg rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg btn-gradient-primary" style={{ padding: '16px 36px', fontSize: 'var(--text-base)' }}>
                      Go to Dashboard <ArrowRight size={20} />
                    </Link>
                  ) : (
                    <>
                      <Link to="/register" className="btn btn-lg rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg btn-gradient-primary" style={{ padding: '16px 36px', fontSize: 'var(--text-base)' }}>
                        Get Protected Free <ArrowRight size={20} />
                      </Link>
                      <button onClick={() => {
                        document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                      }} className="btn btn-lg rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2" style={{
                        padding: '16px 36px',
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-secondary)',
                        border: '2px solid var(--border-color)',
                        background: 'var(--bg-primary)'
                      }}>
                        See How It Works
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-5 d-flex align-items-center gap-4 flex-wrap">
                  <div className="d-flex align-items-center gap-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                    <ShieldCheck size={16} className="text-success" /> Bank-Grade Security
                  </div>
                  <div className="d-flex align-items-center gap-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                    <Award size={16} className="text-success" /> LEA Database Verified
                  </div>
                  <div className="d-flex align-items-center gap-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                    <Zap size={16} className="text-success" /> Real-Time Sync
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="col-lg-6 position-relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="position-relative d-flex justify-content-center align-items-center"
                style={{ minHeight: '520px' }}
              >
                {/* Main phone mockup */}
                <div className="position-relative z-1" style={{
                  width: '300px', height: '580px',
                  borderRadius: '40px',
                  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                  border: '4px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
                  overflow: 'hidden'
                }}>
                  {/* Status bar */}
                  <div className="d-flex justify-content-between px-5 py-3" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-sm)' }}>
                    <span>9:41</span>
                    <div className="d-flex gap-1 align-items-center">
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }}></div>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }}></div>
                      <div style={{ width: 22, height: 10, borderRadius: 3, border: '2px solid rgba(255,255,255,0.5)', position: 'relative' }}>
                        <div className="position-absolute bg-success rounded-1" style={{ top: 1, left: 1, bottom: 1, width: '60%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Phone content */}
                  <div className="px-3" style={{ color: 'white' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4 mt-2 px-1">
                      <span className="fw-bold" style={{ fontSize: 'var(--text-lg)' }}>My Devices</span>
                      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                        <Shield size={14} className="text-white" />
                      </div>
                    </div>

                    {/* Device 1 */}
                    <div className="rounded-3 p-3 mb-3" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                      <div className="d-flex gap-3 align-items-center">
                        <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.1)' }}>
                          <Phone size={22} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold">iPhone 14 Pro</div>
                          <div className="d-flex align-items-center gap-1" style={{ color: '#22c55e', fontSize: 'var(--text-xs)' }}>
                            <CheckCircle size={10} /> Protected
                          </div>
                        </div>
                        <div className="rounded-pill px-2 py-1" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                          Live
                        </div>
                      </div>
                    </div>

                    {/* Device 2 */}
                    <div className="rounded-3 p-3 mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="d-flex gap-3 align-items-center">
                        <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.05)' }}>
                          <Laptop size={22} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold" style={{ opacity: 0.7 }}>MacBook Air</div>
                          <div className="d-flex align-items-center gap-1" style={{ color: '#22c55e', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                            <CheckCircle size={10} /> Protected
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Alert */}
                    <div className="rounded-3 p-3 mt-4 d-flex align-items-start gap-2" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
                      <AlertTriangle size={16} className="flex-shrink-0 mt-1" style={{ color: '#f43f5e' }} />
                      <div>
                        <div className="fw-semibold" style={{ color: '#f43f5e', fontSize: 'var(--text-sm)' }}>Stolen Alert</div>
                        <div style={{ color: 'rgba(244,63,94,0.7)', fontSize: 'var(--text-xs)' }}>1 Device in your area reported stolen recently.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating card 1 - top right */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="position-absolute d-none d-lg-flex align-items-center gap-3 p-3 rounded-3 shadow-lg"
                  style={{
                    top: '5%', right: '-5%', zIndex: 2,
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: 'rgba(34,197,94,0.15)' }}>
                    <CheckCircle size={20} className="text-success" />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Device Verified</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>IMEI: 3546810...</div>
                  </div>
                </motion.div>

                {/* Floating card 2 - bottom left */}
                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="position-absolute d-none d-lg-flex align-items-center gap-3 p-3 rounded-3 shadow-lg"
                  style={{
                    bottom: '10%', left: '-8%', zIndex: 2,
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: 'rgba(99,102,241,0.15)' }}>
                    <Database size={20} className="text-accent" />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Registry Updated</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Real-time sync</div>
                  </div>
                </motion.div>

                {/* Floating card 3 - top left */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="position-absolute d-none d-xl-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-lg"
                  style={{
                    top: '25%', left: '-12%', zIndex: 2,
                    background: 'rgba(245,158,11,0.12)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: '#d97706',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600
                  }}
                >
                  <MapPin size={14} /> 12 Recovered This Week
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== MARQUEE STATS ===================== */}
      <section className="py-4 position-relative overflow-hidden" style={{
        background: 'transparent',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="container">
          <div className="row g-4">
            <div className="col-6 col-lg-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center p-3"
              >
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  <Users size={20} className="text-primary" />
                  <span className="fw-bold" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text-primary)' }}>
                    {stats.users.toLocaleString()}
                  </span>
                </div>
                <div className="text-uppercase fw-semibold" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)' }}>Users</div>
              </motion.div>
            </div>
            <div className="col-6 col-lg-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center p-3"
              >
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  <Smartphone size={20} style={{ color: 'var(--text-primary)' }} />
                  <span className="fw-bold" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text-primary)' }}>
                    {stats.devices.toLocaleString()}
                  </span>
                </div>
                <div className="text-uppercase fw-semibold" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)' }}>Devices</div>
              </motion.div>
            </div>
            <div className="col-6 col-lg-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center p-3"
              >
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  <ShieldCheck size={20} className="text-success" />
                  <span className="fw-bold" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text-primary)' }}>
                    {stats.verified_devices.toLocaleString()}
                  </span>
                </div>
                <div className="text-uppercase fw-semibold" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)' }}>Verified</div>
              </motion.div>
            </div>
            <div className="col-6 col-lg-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center p-3"
              >
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  <RefreshCw size={20} className="text-warning" />
                  <span className="fw-bold" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text-primary)' }}>
                    {stats.recovered_devices.toLocaleString()}
                  </span>
                </div>
                <div className="text-uppercase fw-semibold" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)' }}>Recovered</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES SECTION ===================== */}
      <section id="features-section" className="py-5 position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ zIndex: 0 }}>
          <div className="w-100 h-100" style={{
            backgroundImage: `url('/images/features-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2
          }}></div>
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{
            background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 20%, transparent 80%, var(--bg-primary) 100%)'
          }}></div>
        </div>
        <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <span className="d-inline-block px-3 py-1 rounded-pill fw-semibold mb-3" style={{
              fontSize: 'var(--text-sm)',
              background: 'rgba(22,163,74,0.08)',
              color: 'var(--primary-600)',
              border: '1px solid rgba(22,163,74,0.15)'
            }}>Why Choose Prove Ownership</span>
            <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--text-primary)' }}>
              Security Made Simple
            </h2>
            <p className="mx-auto" style={{ maxWidth: '600px', color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
              We've removed all the technical jargon. Protecting your belongings is now as easy as taking a photo.
            </p>
          </motion.div>

          <div className="row g-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="col-lg-4 col-md-6"
                >
                  <div className="card h-100 border-0 p-4 rounded-4 hover-lift" style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'default'
                  }}>
                    <div className="d-flex align-items-center justify-content-center mb-4" style={{
                      width: 56, height: 56,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${idx % 3 === 0 ? 'rgba(22,163,74,0.1)' : idx % 3 === 1 ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)'}, transparent)`
                    }}>
                      <Icon size={28} style={{
                        color: idx % 3 === 0 ? 'var(--primary-600)' : idx % 3 === 1 ? 'var(--accent-500)' : 'var(--warning-500)'
                      }} />
                    </div>
                    <h5 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h5>
                    <p className="mb-0" style={{ color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>{feature.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mid-section CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-5 pt-4"
          >
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="btn btn-lg rounded-pill fw-bold d-inline-flex align-items-center gap-2"
              style={{
                padding: '14px 32px',
                color: 'var(--text-secondary)',
                border: '2px solid var(--border-color)',
                background: 'var(--bg-primary)'
              }}
            >
              <Search size={18} /> Check a Device Status
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===================== TEAM SECTION ===================== */}
      <section className="py-5 position-relative overflow-hidden" style={{ background: 'transparent' }}>
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-[0.03]" style={{
          background: 'radial-gradient(circle at 30% 50%, var(--primary-500) 0%, transparent 50%), radial-gradient(circle at 70% 50%, var(--accent-500) 0%, transparent 50%)',
          pointerEvents: 'none'
        }}></div>

        <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <span className="d-inline-block px-3 py-1 rounded-pill fw-semibold mb-3" style={{
              fontSize: 'var(--text-sm)',
              background: 'rgba(99,102,241,0.08)',
              color: 'var(--accent-500)',
              border: '1px solid rgba(99,102,241,0.15)'
            }}>Our Team</span>
            <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--text-primary)' }}>
              Real People, Real Protection
            </h2>
            <p className="mx-auto" style={{ maxWidth: '650px', color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
              We're a team of everyday people, tech lovers, and problem solvers who were tired of losing our devices. We built this for you.
            </p>
          </motion.div>

          <div className="row g-4 justify-content-center">
            {displayTeam.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="col-lg-4 col-md-6"
              >
                <div
                  className="card h-100 border-0 overflow-hidden rounded-4"
                  onClick={() => setSelectedMember(member)}
                  style={{ cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                  <div className="position-relative overflow-hidden" style={{ height: '300px' }}>
                    <img
                      src={member.name === "Sarah Okonjo" ? "/images/team-ceo.png" : member.name === "David Adeleke" ? "/images/team-cto.png" : member.name === "Grace Ibrahim" ? "/images/team-community.png" : (member.image_url || member.image)}
                      alt={member.name}
                      className="w-100 h-100 object-fit-cover"
                      style={{ transition: 'transform 0.5s ease' }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
                    }}>
                      <div className="text-white fw-bold">{member.name}</div>
                      <div className="text-white-50" style={{ fontSize: 'var(--text-sm)' }}>{member.role}</div>
                    </div>
                  </div>
                  <div className="card-body p-4">
                    <p className="mb-0" style={{ color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>
                      {member.content || member.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS SECTION ===================== */}
      <section className="py-5 position-relative overflow-hidden">
        <div className="container py-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <span className="d-inline-block px-3 py-1 rounded-pill fw-semibold mb-3" style={{
              fontSize: 'var(--text-sm)',
              background: 'rgba(245,158,11,0.08)',
              color: '#d97706',
              border: '1px solid rgba(245,158,11,0.15)'
            }}>Testimonials</span>
            <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--text-primary)' }}>
              Trusted by Users Nationwide
            </h2>
            <p className="mx-auto" style={{ maxWidth: '600px', color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
              See what our community is saying about their experience with Prove Ownership.
            </p>
          </motion.div>

          <div className="row g-4">
            {displayTestimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="col-md-6 col-lg-3"
              >
                <div className="card h-100 border-0 p-4 rounded-4 position-relative" style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div className="position-absolute top-0 start-0 p-3 text-primary opacity-25" style={{ fontSize: '3rem', lineHeight: 1 }}>
                    <Quote size={32} />
                  </div>
                  <div className="mb-3 mt-2" style={{ color: '#f59e0b' }}>
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" className="me-1" />)}
                  </div>
                  <p className="mb-4 flex-grow-1" style={{
                    color: 'var(--text-primary)',
                    lineHeight: 'var(--leading-relaxed)',
                    fontSize: 'var(--text-sm)'
                  }}>
                    "{testimonial.content || testimonial.quote}"
                  </p>
                  <div className="d-flex align-items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <img
                      src={testimonial.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=16a34a&color=fff&bold=true`}
                      alt={testimonial.name}
                      className="rounded-circle object-fit-cover shadow-sm flex-shrink-0"
                      style={{ width: 44, height: 44 }}
                    />
                    <div>
                      <div className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{testimonial.name}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                        {testimonial.role}{testimonial.location ? ` \u2022 ${testimonial.location}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="py-5 position-relative overflow-hidden">
        <div className="container py-5">
          <div className="rounded-5 overflow-hidden position-relative text-center p-4 p-md-5 shadow-lg" style={{ minHeight: '350px' }}>
            <div className="position-absolute top-0 start-0 w-100 h-100" style={{
              backgroundImage: `url('/images/cta-bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.8,
              backgroundBlendMode: 'overlay',
              backgroundColor: 'rgba(5, 150, 105, 0.4)'
            }}></div>
            <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)'
            }}></div>
            <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ pointerEvents: 'none' }}>
              <div className="position-absolute rounded-circle" style={{
                width: 300, height: 300,
                top: '-10%', right: '10%',
                background: 'rgba(255,255,255,0.05)',
                filter: 'blur(40px)'
              }}></div>
              <div className="position-absolute rounded-circle" style={{
                width: 200, height: 200,
                bottom: '-5%', left: '20%',
                background: 'rgba(255,255,255,0.05)',
                filter: 'blur(30px)'
              }}></div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="position-relative z-1 py-4"
              style={{ color: 'white' }}
            >
              <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}>
                Ready to Protect What Matters?
              </h2>
              <p className="mb-5 mx-auto opacity-90" style={{ maxWidth: '600px', fontSize: 'clamp(1rem, 2vw, 1.2rem)' }}>
                Don't wait until it's too late. Join thousands of people who already trust Prove Ownership to keep their phones and laptops safe.
              </p>

              {!user && (
                <div className="d-flex justify-content-center gap-3 flex-column flex-sm-row">
                  <Link to="/register" className="btn btn-light btn-lg rounded-pill fw-bold shadow-lg d-inline-flex align-items-center gap-2" style={{ padding: '16px 40px', color: '#059669' }}>
                    Create Free Account <ChevronRight size={20} />
                  </Link>
                  <button
                    onClick={() => setIsSearchModalOpen(true)}
                    className="btn btn-lg rounded-pill fw-bold d-inline-flex align-items-center gap-2"
                    style={{
                      padding: '16px 40px',
                      border: '2px solid rgba(255,255,255,0.25)',
                      color: 'white',
                      background: 'transparent'
                    }}
                  >
                    Check a Device
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="py-5" style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div className="container px-4">
          <div className="row g-4 pb-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <img src="/logo1.png" alt="Prove Ownership Logo" style={{ height: 32, objectFit: 'contain' }} />
                <span className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>Prove Ownership</span>
              </div>
              <p style={{ color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>
                Empowering ownership, preventing theft, and enabling recovery through technology.
              </p>
              <div className="d-flex gap-3 mt-3">
                {['facebook', 'twitter', 'linkedin', 'instagram'].map((social) => (
                  <a key={social} href={`#${social}`} className="d-inline-flex align-items-center justify-content-center rounded-circle text-decoration-none" style={{
                    width: 36, height: 36,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {social[0].toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
            <div className="col-6 col-lg-2 offset-lg-1">
              <h6 className="fw-bold mb-3 text-uppercase" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)' }}>Platform</h6>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><Link to="/search" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Public Search</Link></li>
                <li><Link to="/marketplace/browse" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Marketplace</Link></li>
                <li><Link to="/found-device" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Report Found</Link></li>
              </ul>
            </div>
            <div className="col-6 col-lg-2">
              <h6 className="fw-bold mb-3 text-uppercase" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)' }}>Company</h6>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><a href="#about" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>About Us</a></li>
                <li><a href="#contact" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Contact</a></li>
                <li><Link to="/privacy" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Privacy</Link></li>
              </ul>
            </div>
            <div className="col-lg-3">
              <h6 className="fw-bold mb-3 text-uppercase" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)' }}>Stay Updated</h6>
              <div className="d-flex gap-2">
                <input type="text" className="form-control" placeholder="Enter your email" aria-label="Email" style={{ borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }} />
                <button className="btn btn-primary flex-shrink-0" type="button" style={{ borderRadius: 12, whiteSpace: 'nowrap', padding: '10px 20px' }}>Subscribe</button>
              </div>
              <small className="d-block mt-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                Latest security alerts and feature updates.
              </small>
            </div>
          </div>
          <div className="pt-4 mt-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              &copy; {new Date().getFullYear()} Prove Ownership. All rights reserved.
            </span>
            <div className="d-flex gap-3">
              <a href="#terms" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Terms</a>
              <Link to="/privacy" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Privacy</Link>
              <a href="#cookies" className="text-decoration-none" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ===================== TEAM MEMBER MODAL ===================== */}
      <AnimatePresence>
        {selectedMember && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, padding: '20px', backdropFilter: 'blur(4px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ maxWidth: '800px', width: '100%' }}
            >
              <div className="overflow-hidden border-0 rounded-4 shadow-lg" style={{ background: 'var(--bg-primary)' }}>
                <div className="row g-0">
                  <div className="col-md-5 position-relative" style={{ minHeight: '300px' }}>
                    <img
                      src={selectedMember.image_url || selectedMember.image}
                      alt={selectedMember.name}
                      className="w-100 h-100 object-fit-cover position-absolute"
                    />
                  </div>
                  <div className="col-md-7">
                    <div className="p-4 d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{selectedMember.name}</h5>
                        <div className="fw-semibold" style={{ color: 'var(--primary-600)', fontSize: 'var(--text-sm)' }}>{selectedMember.role}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMember(null)}
                        className="btn p-2 border-0 rounded-2 d-flex align-items-center justify-content-center"
                        style={{ color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', width: 36, height: 36 }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="px-4 pb-4">
                      <p className="mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                        {selectedMember.content || selectedMember.desc}
                      </p>
                      <button className="btn btn-outline-primary rounded-pill px-4 fw-semibold" onClick={() => setSelectedMember(null)}>Close Profile</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================== SEARCH/VERIFICATION MODAL ===================== */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, padding: '20px', backdropFilter: 'blur(4px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ maxWidth: '480px', width: '100%' }}
            >
              <div className="border-0 rounded-4 shadow-lg overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                <div className="p-4 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <Search size={20} style={{ color: 'var(--primary-600)' }} />
                    <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Verify Device Status</h5>
                  </div>
                  <button
                    type="button"
                    className="btn p-2 border-0 rounded-2 d-flex align-items-center justify-content-center"
                    style={{ color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', width: 36, height: 36 }}
                    onClick={() => { setIsSearchModalOpen(false); setSearchResult(null); setSearchImei(''); setSearchSerial(''); }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4">
                  <p className="mb-4" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Enter IMEI or Serial Number to check if a device has been reported stolen.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>IMEI Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-transparent" style={{ borderColor: 'var(--border-color)', borderRadius: '12px 0 0 12px' }}>
                        <Smartphone size={16} style={{ color: 'var(--text-tertiary)' }} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        style={{ borderRadius: '0 12px 12px 0', borderColor: 'var(--border-color)' }}
                        placeholder="e.g. 3546..."
                        value={searchImei}
                        onChange={(e) => setSearchImei(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>Serial Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-transparent" style={{ borderColor: 'var(--border-color)', borderRadius: '12px 0 0 12px' }}>
                        <Cpu size={16} style={{ color: 'var(--text-tertiary)' }} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        style={{ borderRadius: '0 12px 12px 0', borderColor: 'var(--border-color)' }}
                        placeholder="e.g. SN123..."
                        value={searchSerial}
                        onChange={(e) => setSearchSerial(e.target.value)}
                      />
                    </div>
                  </div>

                  {searchError && (
                    <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#dc2626', fontSize: 'var(--text-sm)' }}>
                      <AlertTriangle size={16} className="flex-shrink-0" />
                      {searchError}
                    </div>
                  )}

                  {searchResult && (
                    <div className={`d-flex align-items-start gap-2 p-3 rounded-3 mb-3 ${searchResult.status === 'clean' ? 'alert-banner-success' : 'alert-banner-danger'}`} style={{ fontSize: 'var(--text-sm)' }}>
                      <div className="flex-shrink-0 mt-1">
                        {searchResult.status === 'clean' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      </div>
                      <div>
                        <div className="fw-semibold">{searchResult.message}</div>
                        <div className="opacity-75" style={{ fontSize: 'var(--text-xs)' }}>
                          {searchResult.status === 'clean'
                            ? "No active reports found. Proceed with caution."
                            : "Do not proceed. Contact authorities or the rightful owner."}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSearchCheck}
                    disabled={searchLoading || (!searchImei && !searchSerial)}
                    className="btn btn-primary w-100 btn-lg rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2"
                    style={{ minHeight: 52 }}
                  >
                    {searchLoading ? (
                      <span className="d-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Checking...
                      </span>
                    ) : (
                      <span className="d-flex align-items-center gap-2">
                        <Search size={18} /> Check Status
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </>
  );
}