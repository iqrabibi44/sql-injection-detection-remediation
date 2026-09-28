import { Link } from "wouter";
import { Shield, Code, Zap, Lock, BarChart3, CheckCircle2, ArrowRight, Terminal, Bug, ShieldCheck, Globe, Cpu, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";

/* ─── Animated Counter Hook ─── */
function useCounter(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

/* ─── Intersection Observer Hook ─── */
function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Typing Effect Component ─── */
function TypingCode() {
  const lines = [
    { text: 'const query = "SELECT * FROM users', cls: "text-red-400" },
    { text: '  WHERE id = \'" + userId + "\'";', cls: "text-red-400" },
    { text: "", cls: "" },
    { text: "// ⚠ SQL Injection detected!", cls: "text-yellow-400" },
    { text: "// ✓ CyberNest Fix: Use parameterized query", cls: "text-emerald-400" },
    { text: "", cls: "" },
    { text: 'const query = "SELECT * FROM users', cls: "text-emerald-400" },
    { text: '  WHERE id = $1";', cls: "text-emerald-400" },
    { text: "const result = await db.query(query, [userId]);", cls: "text-emerald-400" },
  ];
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLines((p) => (p >= lines.length ? 0 : p + 1));
    }, 400);
    return () => clearInterval(timer);
  }, [lines.length]);

  return (
    <div className="font-mono text-xs sm:text-sm leading-relaxed">
      {lines.slice(0, visibleLines).map((line, i) => (
        <div key={i} className={`${line.cls} min-h-[1.5em]`}>
          {line.text}
        </div>
      ))}
      <span className="inline-block w-2 h-4 bg-primary animate-blink" />
    </div>
  );
}

/* ─── Floating Orb ─── */
function Orb({ size, color, top, left, delay }: { size: number; color: string; top: string; left: string; delay: string }) {
  return (
    <div
      className="absolute rounded-full blur-3xl animate-float pointer-events-none"
      style={{ width: size, height: size, background: color, top, left, animationDelay: delay, opacity: 0.15 }}
    />
  );
}

/* ─── Scan Result Row ─── */
function ScanRow({ severity, label, desc, delay }: { severity: "high" | "med" | "fixed"; label: string; desc: string; delay: string }) {
  const colors = {
    high: "bg-red-500/10 border-red-500/30 text-red-400",
    med: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    fixed: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  };
  const dots = { high: "bg-red-500", med: "bg-yellow-500", fixed: "bg-emerald-500" };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors[severity]} hero-reveal`} style={{ animationDelay: delay }}>
      <div className="relative mt-1.5">
        <div className={`w-2 h-2 rounded-full ${dots[severity]}`} />
        <div className={`absolute inset-0 w-2 h-2 rounded-full ${dots[severity]} animate-ripple`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm truncate">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ HERO PAGE ═══════════════════════════════════════════ */
export default function Hero() {
  const statsSection = useInView(0.3);
  const featuresSection = useInView(0.15);
  const stepsSection = useInView(0.15);
  const ctaSection = useInView(0.3);

  const v1 = useCounter(10000, 2200, statsSection.inView);
  const v2 = useCounter(8, 1200, statsSection.inView);
  const v3 = useCounter(99, 1800, statsSection.inView);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Background Grid ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* ── Floating Orbs ── */}
      <Orb size={500} color="rgba(59,130,246,0.3)" top="-5%" left="-10%" delay="0s" />
      <Orb size={400} color="rgba(139,92,246,0.25)" top="30%" left="75%" delay="1.5s" />
      <Orb size={350} color="rgba(6,182,212,0.2)" top="70%" left="10%" delay="3s" />

      {/* ════ Navbar ════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <div className="relative">
                <Shield className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 w-8 h-8 bg-primary/20 rounded-full blur-lg group-hover:bg-primary/40 transition-all" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Cyber<span className="text-primary">Nest</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              <a href="#stats" className="hover:text-foreground transition-colors">Stats</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="button-signin">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" data-testid="button-signup">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ════ Hero Section ════ */}
      <section className="relative pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left – Copy */}
            <div>
              {/* Badge */}
              <div className="hero-slide-left inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
                <ShieldCheck className="w-4 h-4" />
                AI-Powered SQL Injection Detector
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              </div>

              <h1 className="hero-slide-left delay-200 text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                Detect SQL{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
                    Vulnerabilities
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none"><path d="M1 5.5Q50 1 100 5t99 0" stroke="url(#ug)" strokeWidth="2" strokeLinecap="round"/><defs><linearGradient id="ug" x1="0" y1="0" x2="200" y2="0"><stop stopColor="hsl(213,96%,54%)"/><stop offset="1" stopColor="hsl(186,100%,50%)"/></linearGradient></defs></svg>
                </span>
                <br />
                <span className="text-foreground">Instantly With ML</span>
              </h1>

              <p className="hero-slide-left delay-300 text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
                CyberNest uses a trained machine learning model to detect and remediate SQL injection vulnerabilities across <span className="text-foreground font-medium">8+ programming languages</span> — in seconds.
              </p>

              <div className="hero-slide-left delay-400 flex flex-wrap gap-4 mb-10">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 text-base px-8 group" data-testid="button-get-started">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 text-base px-8" data-testid="button-sign-in">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="hero-slide-left delay-500 flex items-center gap-6 text-muted-foreground text-sm">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free to start</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant results</span>
              </div>
            </div>

            {/* Right – Interactive Terminal */}
            <div className="hero-slide-right delay-300 relative">
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/10 to-cyan-500/20 rounded-3xl blur-2xl" />

              <Card className="relative p-0 overflow-hidden bg-[hsl(220,18%,7%)] border-white/10 shadow-2xl shadow-primary/10">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground font-mono flex items-center justify-center gap-1.5">
                      <Terminal className="w-3 h-3" /> cybernest --scan app.js
                    </span>
                  </div>
                </div>

                {/* Code Section */}
                <div className="p-5 border-b border-white/5">
                  <TypingCode />
                </div>

                {/* Scan Results */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scan Results</span>
                    <span className="text-xs text-primary font-mono">3 findings</span>
                  </div>
                  <ScanRow severity="high" label="Line 42: SQL Injection Found" desc="Critical — user input concatenated directly" delay="600ms" />
                  <ScanRow severity="med" label="Line 87: Unsafe Query Pattern" desc="Warning — missing input sanitization" delay="800ms" />
                  <ScanRow severity="fixed" label="Auto-fix Applied ✓" desc="Parameterized query generated by AI" delay="1000ms" />
                </div>

                {/* Scan line */}
                <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-scan-line pointer-events-none" />
              </Card>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 hero-reveal delay-700 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" /> Protected
              </div>
              <div className="absolute -bottom-3 -left-3 hero-reveal delay-800 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                <Cpu className="w-3.5 h-3.5" /> ML Model Active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ Features ════ */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative" ref={featuresSection.ref}>
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="inline-block px-4 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Enterprise-Grade Security Scanning</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Comprehensive vulnerability detection with AI-powered analysis and automated remediation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Code, title: "Multi-Language Support", desc: "Scan code in C++, Java, Python, PHP, Ruby, Go, Rust, and more with intelligent SQL injection pattern detection.", color: "from-blue-500 to-cyan-500" },
              { icon: Zap, title: "AI-Powered Fixes", desc: "Get instant automated fix suggestions with context-aware code remediation powered by CyberNest's trained ML model.", color: "from-purple-500 to-pink-500" },
              { icon: BarChart3, title: "Real-Time Dashboard", desc: "Track vulnerabilities, monitor scans, and visualize security metrics in real-time across your entire codebase.", color: "from-emerald-500 to-teal-500" },
            ].map((f, i) => (
              <Card
                key={f.title}
                className={`group relative p-6 bg-white/[0.02] border-white/5 hover:border-primary/30 hover:bg-white/[0.04] transition-all duration-500 cursor-pointer overflow-hidden ${featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${i * 150 + 200}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} mb-4`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                <ArrowRight className="w-4 h-4 text-primary mt-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ════ How It Works ════ */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 relative" ref={stepsSection.ref}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center mb-16 transition-all duration-700 ${stepsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="inline-block px-4 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">Workflow</span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How CyberNest Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Three simple steps to secure your code against SQL injection</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/30 via-purple-500/30 to-emerald-500/30" />

            {[
              { step: "01", title: "Paste Your Code", desc: "Paste your code snippet or upload files in any of 8+ supported languages", icon: Terminal, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
              { step: "02", title: "ML Analysis", desc: "CyberNest's trained ML model scans for SQL injection vulnerabilities instantly", icon: Lock, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
              { step: "03", title: "Get AI Fixes", desc: "Review detailed scan reports and apply AI-generated parameterized query fixes", icon: CheckCircle2, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`text-center relative transition-all duration-700 ${stepsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${i * 200 + 200}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border ${item.color} mb-6 relative`}>
                  <item.icon className="w-7 h-7" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-white/10 text-xs font-bold flex items-center justify-center text-muted-foreground">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ Stats ════ */}
      <section id="stats" className="py-24 px-4 sm:px-6 lg:px-8" ref={statsSection.ref}>
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${statsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="inline-block px-4 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">By The Numbers</span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Trusted by Developers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">CyberNest has helped developers identify and fix thousands of SQL injection vulnerabilities</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: `${v1.toLocaleString()}+`, label: "Vulnerabilities Detected", icon: Bug, color: "text-red-400" },
              { value: `${v2}+`, label: "Languages Supported", icon: Globe, color: "text-blue-400" },
              { value: `${v3}.9%`, label: "Detection Accuracy", icon: ShieldCheck, color: "text-emerald-400" },
              { value: "24/7", label: "Real-Time Monitoring", icon: Database, color: "text-purple-400" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 ${statsSection.inView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-3`} />
                <div className={`text-3xl lg:text-4xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative" ref={ctaSection.ref}>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className={`max-w-3xl mx-auto text-center relative transition-all duration-700 ${ctaSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-8">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Start Securing Your Code{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Today</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join developers protecting their applications with CyberNest's AI-powered SQL injection detection and automated remediation
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 text-base px-10 group" data-testid="button-start-free">
              Get Started Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ════ Footer ════ */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Cyber<span className="text-primary">Nest</span></span>
          </div>
          <p className="text-sm text-muted-foreground">&copy; 2025 CyberNest. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
