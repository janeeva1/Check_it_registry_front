import "./landing-v1.css";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Shield, ShieldCheck, Search, Bell, Lock, Zap, MapPin, ArrowRight,
  CheckCircle2, Smartphone, Laptop, Menu, X, Star, Quote, Fingerprint,
  AlertTriangle
} from "lucide-react";

const features = [
  { icon: Lock, title: "Your Digital Vault", desc: "A safe, permanent record of your personal devices, linked cryptographically to your identity." },
  { icon: ShieldCheck, title: "Prove It's Yours", desc: "Selling your phone? Show buyers instant, trusted ownership verification in seconds." },
  { icon: Search, title: "Find Missing Items", desc: "Lost something? We instantly notify law enforcement and block it from being resold." },
  { icon: Fingerprint, title: "Anti-Theft Shield", desc: "Devices are cryptographically tied to your identity, making theft pointless." },
  { icon: Bell, title: "Real-Time Intelligence", desc: "Get alerts about stolen devices in your area and stay ahead of the market." },
  { icon: MapPin, title: "Nationwide Coverage", desc: "Integrated with law enforcement databases across Nigeria for faster recovery." },
];

const steps = [
  { n: "01", title: "Register", desc: "Snap a photo, add your IMEI or serial. Takes under 60 seconds." },
  { n: "02", title: "Verify", desc: "We link the device to your verified identity on our secure registry." },
  { n: "03", title: "Protect", desc: "Prove ownership, resell safely, or recover instantly if it goes missing." },
];

const testimonials = [
  { name: "John Michael", role: "Verified User", quote: "I recovered my stolen laptop within 48 hours thanks to the registry. The police were able to flag it immediately." },
  { name: "Musa Ahmed", role: "Verified User", quote: "Did use this system and it was worth every second. My phone is finally safe." },
  { name: "Lt. Col. Agunta", role: "DG OPDS", quote: "Securing your device with this system is the way forward for national safety." },
];

export default function LandingV1() {
  const [open, setOpen] = useState(false);
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
    <div className="landing-v1 min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">Check It</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#verify" className="hover:text-foreground transition">Verify</a>
            <a href="#testimonials" className="hover:text-foreground transition">Reviews</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition">Sign in</Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90 transition">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden text-foreground p-2" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur">
            <div className="px-4 py-4 flex flex-col gap-3 text-sm">
              <a href="#features" onClick={() => setOpen(false)}>Features</a>
              <a href="#how" onClick={() => setOpen(false)}>How it works</a>
              <a href="#verify" onClick={() => setOpen(false)}>Verify</a>
              <a href="#testimonials" onClick={() => setOpen(false)}>Reviews</a>
              <Link to="/register" onClick={() => setOpen(false)} className="rounded-full bg-primary text-primary-foreground text-center py-2 font-semibold mt-2">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Now LIVE in Nigeria
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              Protect your{" "}
              <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">devices</span>{" "}
              before it's too late.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Every day, thousands of phones and laptops go missing. Register your gadgets,
              prove you own them, and recover them faster if they're ever lost or stolen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition">
                Get Protected Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 backdrop-blur px-6 py-3.5 text-sm font-semibold hover:bg-surface transition">
                See How It Works
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Bank-Grade Security</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> LEA Database Verified</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Real-Time Sync</span>
            </div>
          </div>

          {/* Hero card mockup */}
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/20 blur-3xl rounded-full" aria-hidden />
            <div className="relative rounded-3xl border border-border bg-surface/80 backdrop-blur-xl p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">My Devices</p>
                  <p className="text-lg font-bold">3 Protected</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-[10px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> LIVE
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Smartphone, name: "iPhone 14 Pro", status: "Verified · IMEI 3546810…" },
                  { icon: Laptop, name: "MacBook Air", status: "Verified · SN C02X…" },
                  { icon: Smartphone, name: "Pixel 8", status: "Verified · IMEI 8821334…" },
                ].map((d) => (
                  <div key={d.name} className="flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated/60 p-3">
                    <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/15 text-primary">
                      <d.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.status}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 p-3 flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Registry synced</p>
                  <p className="text-xs text-muted-foreground">All devices matched with LEA database.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { k: "12K+", v: "Users protected" },
            { k: "48K+", v: "Devices registered" },
            { k: "99.8%", v: "Verification rate" },
            { k: "48h", v: "Avg. recovery time" },
          ].map((s) => (
            <div key={s.v} className="text-center md:text-left">
              <p className="text-3xl md:text-4xl font-black bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">{s.k}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Why Check It</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">Security made brilliantly simple.</h2>
            <p className="mt-4 text-muted-foreground">We've stripped away the jargon. Protecting your belongings is now as easy as taking a photo.</p>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group relative rounded-2xl border border-border bg-surface/60 p-6 hover:border-primary/40 hover:bg-surface transition">
                <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-bold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 md:py-28 bg-surface/40 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-8 bg-primary/20 blur-3xl rounded-full" aria-hidden />
            <div className="relative rounded-3xl border border-border shadow-[var(--shadow-card)] w-full h-[500px] flex items-center justify-center" style={{ background: "linear-gradient(180deg, #1a1a2e, #16213e)" }}>
              <div className="text-center text-muted-foreground">
                <Shield className="h-16 w-16 mx-auto mb-4 text-primary opacity-60" />
                <p className="text-sm">Check It App</p>
                <p className="text-xs opacity-60 mt-1">Coming soon to iOS & Android</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">Three steps to peace of mind.</h2>
            <div className="mt-10 space-y-6">
              {steps.map((s) => (
                <div key={s.n} className="flex gap-5">
                  <div className="shrink-0 grid place-items-center h-12 w-12 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-black shadow-[var(--shadow-glow)]">
                    {s.n}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verify */}
      <section id="verify" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="relative rounded-3xl border border-border bg-surface/60 p-8 md:p-12 overflow-hidden">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" aria-hidden />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Public Search</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">Check a device status.</h2>
              <p className="mt-3 text-muted-foreground max-w-lg">Buying secondhand? Enter the IMEI or serial to instantly verify if a device is registered, stolen, or clean.</p>
              <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex">
                <input
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  type="text"
                  placeholder="Enter IMEI or serial number"
                  className="flex-1 min-w-0 rounded-full border border-border bg-background px-5 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading || !imei.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchLoading ? "Checking…" : <><Search className="h-4 w-4" /> Verify</>}
                </button>
              </div>
              {searchError && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {searchError}
                </div>
              )}
              {searchResult && (
                <div className={`mt-4 flex items-start gap-2 p-3 rounded-xl text-sm ${searchResult.status === "clean" ? "bg-primary/10 border border-primary/20 text-primary" : "bg-destructive/10 border border-destructive/20 text-destructive"}`}>
                  {searchResult.status === "clean" ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div>
                    <div className="font-semibold">{searchResult.message}</div>
                    <div className="opacity-75 text-xs mt-1">
                      {searchResult.status === "clean" ? "No active reports found. Proceed with caution." : "Do not proceed. Contact authorities or the rightful owner."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28 bg-surface/40 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Testimonials</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">Trusted by users nationwide.</h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-surface p-6 flex flex-col">
                <Quote className="h-6 w-6 text-primary" />
                <p className="mt-4 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 p-10 md:p-16 text-center" style={{ background: "var(--gradient-hero)" }}>
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Ready to protect what matters?</h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Join thousands who already trust Check It to keep their phones and laptops safe. It's free to start.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-7 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#verify" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 backdrop-blur px-7 py-4 text-sm font-semibold hover:bg-surface transition">
                  Check a Device
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-9 w-9 rounded-xl bg-[image:var(--gradient-primary)]">
                <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg">Check It</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">Empowering ownership, preventing theft, and enabling recovery through technology.</p>
          </div>
          {[
            { title: "Platform", links: ["Public Search", "Marketplace", "Report Found", "Verify"] },
            { title: "Company", links: ["About", "Contact", "Privacy", "Terms"] },
            { title: "Stay updated", links: ["Newsletter", "Security alerts", "Blog"] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => <li key={l}><a href="#" className="hover:text-foreground transition">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Check It Registry. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Landing page version switcher */}
      <div className="lv-switcher">
        <span className="label">View:</span>
        {[
          { path: "/", label: "Classic" },
          { path: "/landing/v1", label: "Modern" },
          { path: "/landing/v2", label: "Minimal" },
        ].map((v) => (
          <Link
            key={v.path}
            to={v.path}
            className={location.pathname === v.path ? "active" : ""}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
