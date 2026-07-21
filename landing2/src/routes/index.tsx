import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Search,
  ArrowUpRight,
  ArrowRight,
  Check,
  Menu,
  X,
  Linkedin,
  Twitter,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const capabilities = [
  {
    kbd: "01",
    title: "Cryptographic ownership",
    desc: "Each device is bound to a verified identity through an immutable, timestamped registry entry — not a sticker, not a receipt.",
  },
  {
    kbd: "02",
    title: "Point-of-sale verification",
    desc: "Buyers scan an IMEI or serial and receive a legally admissible ownership certificate in under two seconds.",
  },
  {
    kbd: "03",
    title: "Law-enforcement channel",
    desc: "Reported devices are flagged directly with partner agencies and blocked from resale on participating marketplaces.",
  },
  {
    kbd: "04",
    title: "Cross-carrier blocklist",
    desc: "IMEI blacklisting propagates to network operators, rendering stolen handsets commercially inert.",
  },
];

const numbers = [
  { k: "142,308", v: "Devices on register" },
  { k: "48 hrs", v: "Median recovery time" },
  { k: "36", v: "Partner agencies" },
  { k: "99.98%", v: "Verification uptime" },
];

const team = [
  {
    name: "Adaeze Okonkwo",
    role: "Chief Executive Officer",
    bio: "Former Head of Digital Identity at a tier-1 Nigerian bank. Fifteen years across payments and consumer trust.",
    initials: "AO",
  },
  {
    name: "Ibrahim Danjuma",
    role: "Chief Technology Officer",
    bio: "Led infrastructure at two African fintechs. Contributor to open cryptographic standards used across ECOWAS.",
    initials: "ID",
  },
  {
    name: "Chinelo Eze",
    role: "Head of Policy & Partnerships",
    bio: "Ten years advising regulators on device fraud and cross-border enforcement. Called to the Nigerian Bar, 2013.",
    initials: "CE",
  },
  {
    name: "Tunde Bakare",
    role: "Head of Security Engineering",
    bio: "Ex-Interpol technical liaison. Designed the signals pipeline that today powers our stolen-device intelligence.",
    initials: "TB",
  },
];

const press = ["TechCabal", "Business Day", "Nairametrics", "The Guardian NG", "Ventures Africa"];

function Index() {
  const [open, setOpen] = useState(false);
  const [imei, setImei] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground antialiased" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              Prove<span className="text-accent">·</span>Ownership
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#platform" className="hover:text-foreground">Platform</a>
            <a href="#verify" className="hover:text-foreground">Verify</a>
            <a href="#team" className="hover:text-foreground">Team</a>
            <a href="#press" className="hover:text-foreground">Press</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <a href="#signin" className="text-sm text-muted-foreground hover:text-foreground">Sign in</a>
            <a
              href="#register"
              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-glow"
            >
              Register a device <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <button
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-border/60 bg-background md:hidden">
            <div className="flex flex-col gap-1 px-6 py-4 text-sm">
              <a href="#platform" className="py-2">Platform</a>
              <a href="#verify" className="py-2">Verify</a>
              <a href="#team" className="py-2">Team</a>
              <a href="#press" className="py-2">Press</a>
              <a href="#register" className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-primary-foreground">
                Register a device <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Nigeria's national device registry — established 2023
          </div>

          <h1
            className="max-w-4xl text-[2.5rem] leading-[1.02] tracking-[-0.02em] md:text-[4.25rem]"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}
          >
            The record of record for
            <span className="italic text-accent"> who owns what</span>.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            ProveOwnership is the independent registry banks, law-enforcement agencies and marketplaces
            rely on to establish the rightful owner of a phone, laptop or high-value asset — in seconds,
            with cryptographic finality.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#register"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary-glow"
            >
              Register a device <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#verify" className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground">
              Verify an IMEI instead
              <span aria-hidden>→</span>
            </a>
          </div>

          {/* Stat strip */}
          <div className="mt-20 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-border/60 pt-10 md:grid-cols-4">
            {numbers.map((n) => (
              <div key={n.v}>
                <div
                  className="text-3xl tracking-tight text-foreground md:text-4xl"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {n.k}
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">{n.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform capabilities */}
      <section id="platform" className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">§ Platform</div>
              <h2
                className="mt-4 text-4xl leading-tight tracking-tight md:text-5xl"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}
              >
                Built on evidence, not affidavits.
              </h2>
              <p className="mt-6 text-muted-foreground">
                A quiet, disciplined infrastructure — designed to hold up in court, at a border checkpoint,
                and on a marketplace listing at 2am.
              </p>
            </div>

            <div className="md:col-span-8">
              <ul className="divide-y divide-border/70 border-y border-border/70">
                {capabilities.map((c) => (
                  <li key={c.title} className="grid grid-cols-12 gap-6 py-8">
                    <div
                      className="col-span-2 text-sm text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {c.kbd}
                    </div>
                    <div className="col-span-10">
                      <h3 className="text-lg font-semibold tracking-tight">{c.title}</h3>
                      <p className="mt-2 text-muted-foreground">{c.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Verify */}
      <section id="verify" className="border-b border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">§ Verify</div>
              <h2
                className="mt-4 text-4xl leading-tight tracking-tight md:text-5xl"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}
              >
                Before you buy, ask the register.
              </h2>
              <p className="mt-6 text-muted-foreground">
                Enter an IMEI, serial number or asset tag. We will confirm registration status, flag any
                theft or loss report, and — where lawful — connect you to the verified owner.
              </p>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Free for the first 3 lookups each day",
                  "No account required",
                  "Results are legally admissible in Nigerian courts",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 text-accent" />
                    <span className="text-foreground/85">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="rounded-md border border-border bg-card p-6 md:p-8"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <label
                className="text-xs uppercase tracking-[0.16em] text-muted-foreground"
                htmlFor="imei"
              >
                Device identifier
              </label>
              <div className="mt-3 flex items-center gap-2 border-b border-border pb-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  id="imei"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="IMEI, serial or asset tag"
                  className="w-full bg-transparent text-lg outline-none placeholder:text-muted-foreground/70"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>
              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary-glow"
              >
                Run verification <ArrowRight className="h-4 w-4" />
              </button>
              <div className="mt-4 text-xs text-muted-foreground">
                By continuing you agree to the Registry's{" "}
                <a href="#" className="underline decoration-border underline-offset-4 hover:text-foreground">Terms of Use</a>.
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Editorial pull-quote */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-28">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">§ In practice</div>
          <blockquote
            className="mt-6 text-3xl leading-[1.25] tracking-tight md:text-[2.5rem]"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}
          >
            “We used to spend weeks establishing chain of custody on a single handset.
            <span className="text-muted-foreground"> With the registry, it is a matter of minutes — and the record stands up in court.”</span>
          </blockquote>
          <div className="mt-8 flex items-center gap-4 text-sm">
            <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center font-semibold" style={{ fontFamily: "var(--font-serif)" }}>AO</div>
            <div>
              <div className="font-medium">Lt. Col. A. Agunta (Rtd.)</div>
              <div className="text-muted-foreground">Advisor, Directorate of Operations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="border-b border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">§ Team</div>
            <h2
              className="mt-4 text-4xl leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}
            >
              A small team, uncommonly qualified.
            </h2>
            <p className="mt-6 text-muted-foreground">
              We are operators from banking, cryptography, policy and enforcement — building the
              infrastructure we wished existed when our own devices went missing.
            </p>
          </div>

          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <article key={m.name} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-border bg-card">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(160deg, oklch(0.88 0.02 65), oklch(0.78 0.04 55))",
                    }}
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <span
                      className="text-6xl tracking-tight text-primary/70"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {m.initials}
                    </span>
                  </div>
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-primary/70">
                    <span style={{ fontFamily: "var(--font-mono)" }}>Lagos, NG</span>
                    <div className="flex gap-2">
                      <Linkedin className="h-3.5 w-3.5" />
                      <Twitter className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
                <h3
                  className="mt-5 text-xl tracking-tight"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {m.name}
                </h3>
                <div className="mt-1 text-sm text-accent">{m.role}</div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Press */}
      <section id="press" className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              § As covered in
            </div>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              {press.map((p) => (
                <span
                  key={p}
                  className="text-lg text-foreground/60 hover:text-foreground"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontStyle: "italic" }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="register" className="border-b border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <div className="text-xs uppercase tracking-[0.18em] text-primary-foreground/60">§ Get started</div>
              <h2
                className="mt-4 text-4xl leading-[1.05] tracking-tight md:text-6xl"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}
              >
                Put your name on your things.
                <span className="block italic text-accent">Officially.</span>
              </h2>
            </div>
            <div className="md:col-span-4">
              <p className="text-primary-foreground/70">
                Registration takes under two minutes. Verified through your BVN or NIN. No hardware, no monthly fee.
              </p>
              <a
                href="#"
                className="mt-6 inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90"
              >
                Begin registration <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <a href="/" className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[15px] font-semibold tracking-tight">
                  Prove<span className="text-accent">·</span>Ownership
                </span>
              </a>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                An independent national registry for personal and commercial devices.
                Headquartered in Lagos. Operating across Nigeria.
              </p>
            </div>
            <FooterCol
              title="Platform"
              links={["Register", "Verify", "For enforcement", "For marketplaces"]}
            />
            <FooterCol
              title="Company"
              links={["About", "Team", "Press", "Careers"]}
            />
            <FooterCol
              title="Legal"
              links={["Terms", "Privacy", "Data handling", "Contact"]}
            />
          </div>
          <div className="mt-14 flex flex-col gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div style={{ fontFamily: "var(--font-mono)" }}>
              © {new Date().getFullYear()} ProveOwnership Registry Ltd. — RC 1893204
            </div>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Email"><Mail className="h-4 w-4" /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></a>
              <a href="#" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 md:[grid-column:span_2/span_2]">
      <div className="text-xs uppercase tracking-[0.16em] text-foreground">{title}</div>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="hover:text-foreground">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}