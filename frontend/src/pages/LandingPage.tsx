import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Target, CheckCircle2, DollarSign, Brain,
  BarChart3, Lock, Zap, Sun, Moon, Shield, KeyRound,
  Users, FileText, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const FadeInSection = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

// Smooth scroll to section helper
const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export default function LandingPage() {
  const { darkMode, setDarkMode } = useAuthStore();
  const containerRef = useRef(null);

  // Newsletter subscription state
  const [subEmail, setSubEmail]     = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');
  const [subError, setSubError]     = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail.trim()) return;
    setSubLoading(true);
    setSubSuccess('');
    setSubError('');
    try {
      const res = await fetch('http://127.0.0.1:5000/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok || res.status === 200) {
        setSubSuccess(data.message || 'You are subscribed!');
        setSubEmail('');
      } else {
        setSubError(data.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setSubError('Network error. Please check your connection.');
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const mockupY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div
      className="min-h-screen bg-[#FDFDFD] dark:bg-dark-900 transition-colors duration-300 relative overflow-hidden font-sans text-dark-900 dark:text-white selection:bg-brand-500/20"
      ref={containerRef}
    >
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-brand-400/20 dark:bg-brand-500/10 blur-[120px] mix-blend-multiply animate-blob" />
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-blue-400/20 dark:bg-indigo-500/10 blur-[120px] mix-blend-multiply animate-blob-reverse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-indigo-400/15 dark:bg-brand-500/5 blur-[150px] mix-blend-multiply animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/50 dark:bg-dark-900/50 backdrop-blur-md border-b border-white/20 dark:border-dark-800/40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="FinanceAI Logo" className="w-10 h-10" />
            <span className="font-bold text-2xl tracking-tight text-dark-900 dark:text-white">
              FinanceAI
            </span>
          </div>

          {/* Nav links — match actual page sections */}
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-dark-600 dark:text-dark-400">
            <button onClick={() => scrollTo('home')}     className="hover:text-dark-900 dark:hover:text-white transition-colors">Platform</button>
            <button onClick={() => scrollTo('features')} className="hover:text-dark-900 dark:hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo('security')} className="hover:text-dark-900 dark:hover:text-white transition-colors">Security</button>
            <button onClick={() => scrollTo('privacy')}  className="hover:text-dark-900 dark:hover:text-white transition-colors">Privacy & Policy</button>
            <button onClick={() => scrollTo('about')}    className="hover:text-dark-900 dark:hover:text-white transition-colors">About</button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode?.(darkMode === true ? false : true)}
              className="p-2 rounded-full hover:bg-brand-50 dark:hover:bg-dark-800 text-dark-500 hover:text-brand-600 dark:text-dark-400 dark:hover:text-brand-400 transition-colors border border-transparent hover:border-brand-100/50"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/login" className="hidden md:block text-sm font-semibold text-dark-900 dark:text-dark-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Log in
            </Link>
            <Link to="/register" className="px-6 py-2.5 bg-dark-900 text-white dark:bg-white dark:text-dark-900 text-sm font-semibold rounded-full hover:bg-brand-600 dark:hover:bg-brand-600 dark:hover:text-white transition-all shadow-lg hover:shadow-brand-500/30">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">

        {/* HERO SECTION */}
        <section id="home" className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-10 xl:gap-16 min-h-[90vh]">
          <motion.div className="flex-1 w-full" style={{ y: heroY, opacity: opacityFade }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-dark-800/80 backdrop-blur-sm border border-white/80 dark:border-dark-700/50 shadow-sm text-sm font-bold text-brand-600 dark:text-brand-400 mb-8"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
              </span>
              Intelligent Financial Management
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl lg:text-[48px] xl:text-[60px] 2xl:text-[72px] leading-[1.05] font-extrabold tracking-[-0.03em] mb-8 text-dark-900 dark:text-white"
            >
              Core Finance<br />
              Management<br />
              <span className="text-gradient">for Businesses.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-dark-700 dark:text-dark-300 mb-12 max-w-xl font-medium leading-relaxed"
            >
              End-to-end AI financial platform. Automate tracking, uncover gaps, and accelerate your business growth with enterprise-grade intelligence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link to="/register" className="flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-full font-bold text-lg hover:bg-brand-500 transition-all shadow-[0_8px_30px_rgb(139,92,246,0.3)] hover:shadow-[0_8px_40px_rgb(139,92,246,0.5)] hover:-translate-y-1 group">
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-dark-800 border-2 border-dark-900 dark:border-dark-600 text-dark-900 dark:text-white rounded-full font-bold text-lg hover:bg-dark-900 hover:text-white dark:hover:bg-brand-600 dark:hover:border-brand-600 transition-all shadow-sm hover:-translate-y-1">
                Log In
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Mockup */}
          <motion.div className="flex-1 w-full relative perspective-[2000px] h-[600px] hidden lg:block" style={{ y: mockupY }}>
            <div className="absolute top-0 left-0 origin-top-left w-[800px] h-[550px] lg:scale-[0.55] xl:scale-[0.7] 2xl:scale-[0.85] transition-transform duration-300">
              <motion.div
                initial={{ opacity: 0, rotateY: 20, rotateX: 10, scale: 0.8, x: 100 }}
                animate={{ opacity: 1, rotateY: -15, rotateX: 5, scale: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute inset-0 bg-white dark:bg-dark-800 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-dark-700/80 overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-64 bg-dark-900 p-6 flex flex-col border-r border-dark-800">
                  <div className="flex items-center gap-2 mb-12">
                    <div className="w-8 h-8 rounded bg-brand-500" />
                    <div className="h-5 w-24 bg-white/10 rounded" />
                  </div>
                  <div className="space-y-4 flex-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${i === 1 ? 'bg-brand-500/10' : 'opacity-60'}`}>
                        <div className={`w-5 h-5 rounded ${i === 1 ? 'bg-brand-500' : 'bg-white/20'}`} />
                        <div className={`h-3 rounded ${i === 1 ? 'bg-brand-500 w-16' : 'bg-white/20 w-20'}`} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute left-64 right-0 top-0 bottom-0 bg-[#F9FAFB] dark:bg-dark-900 p-8 transition-colors duration-300">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <div className="h-4 w-32 bg-gray-200 dark:bg-dark-700 rounded mb-2" />
                      <div className="h-8 w-48 bg-dark-900 dark:bg-white rounded" />
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-dark-800 shadow-sm border border-transparent dark:border-dark-700" />
                      <div className="w-10 h-10 rounded-full bg-brand-100" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {[
                      { c: 'bg-white dark:bg-dark-800', text: 'text-dark-900 dark:text-white', bar: 'bg-brand-500', h: 'h-6' },
                      { c: 'bg-brand-600', text: 'text-white', bar: 'bg-white', h: 'h-8' },
                      { c: 'bg-white dark:bg-dark-800', text: 'text-dark-900 dark:text-white', bar: 'bg-blue-500', h: 'h-5' }
                    ].map((card, i) => (
                      <div key={i} className={`${card.c} p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700/80 transition-colors duration-300`}>
                        <div className={`h-3 w-16 ${card.text} opacity-50 bg-current rounded mb-3`} />
                        <div className={`h-6 w-24 ${card.text} bg-current rounded mb-4`} />
                        <div className="flex gap-1 items-end h-8">
                          {[1, 2, 3, 4, 5].map((b) => (
                            <div key={b} className={`flex-1 ${card.bar} rounded-t-sm opacity-${b % 2 ? '100' : '50'} ${card.h}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700/80 p-6 h-48 transition-colors duration-300">
                    <div className="h-4 w-40 bg-gray-200 dark:bg-dark-700 rounded mb-6" />
                    <div className="h-[120px] w-full bg-gradient-to-t from-brand-50/50 to-transparent border-b border-brand-200 relative">
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,100 L0,50 Q25,30 50,60 T100,20 L100,100 Z" fill="url(#gradient)" className="opacity-20" />
                        <path d="M0,50 Q25,30 50,60 T100,20" fill="none" stroke="#8B5CF6" strokeWidth="2" />
                        <defs>
                          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-10 top-20 w-48 p-4 glass-panel z-20 text-dark-900 dark:text-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-dark-900 dark:text-white">Transfer complete</div>
                </div>
                <div className="text-xl font-extrabold text-dark-900 dark:text-white">+ $24,500</div>
              </motion.div>

              <motion.div
                animate={{ y: [15, -15, 15] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-10 bottom-10 w-56 p-5 glass-panel z-20 border-brand-200/30 text-dark-900 dark:text-white"
              >
                <div className="text-xs font-bold text-brand-600 dark:text-brand-400 mb-1 uppercase tracking-wider">AI Insight</div>
                <div className="text-sm text-dark-800 dark:text-dark-300 font-medium leading-snug">
                  Your runway extended by 2 months based on recent optimizations.
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-32 px-6 lg:px-12 max-w-[1400px] mx-auto relative z-10">
          <FadeInSection className="max-w-2xl mb-20">
            <h2 className="text-5xl font-extrabold mb-6 tracking-tight dark:text-white">
              Core functionality –<br />
              <span className="text-brand-600">everything you need</span>
            </h2>
            <p className="text-xl text-dark-600 dark:text-dark-300 font-medium">
              A complete suite of financial tools integrated into one single platform, powered by advanced artificial intelligence.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Brain,     title: "AI Analytics Engine",  desc: "Automated insights, anomaly detection, and predictive forecasting for your cash flow.",       color: "bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400" },
              { icon: Target,    title: "Gap Analysis",          desc: "Identify inefficiencies in spending and get actionable recommendations to improve margins.", color: "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
              { icon: DollarSign,title: "Smart Budgeting",       desc: "Dynamic budget allocation that learns from your spending habits and adjusts in real-time.",    color: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
              { icon: Lock,      title: "Role-Based Access",     desc: "Fine-grained access control — Owner, Accountant, Manager, and Employee each see only what they should.",  color: "bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300" },
              { icon: Zap,       title: "Real-time Tracking",    desc: "Record income, expenses, and receipts instantly. See your financial health update live.",    color: "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
              { icon: BarChart3, title: "Custom Reports",        desc: "Generate detailed financial reports including cash flow, category breakdowns, and gap analysis.", color: "bg-pink-50 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400" },
            ].map((f, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className="glass-card dark:bg-dark-800/80 dark:border-dark-700/50 p-10 h-full group">
                  <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-2xl mb-4 dark:text-white">{f.title}</h3>
                  <p className="text-dark-600 dark:text-dark-300 text-lg leading-relaxed">{f.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section id="security" className="py-32 relative overflow-hidden bg-dark-900 text-white rounded-[3rem] mx-4 lg:mx-12 my-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px]" />

          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
            <FadeInSection className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-brand-300 text-sm font-bold mb-6">
                <Shield className="w-4 h-4" /> Enterprise-Grade Security
              </div>
              <h2 className="text-5xl font-extrabold mb-6 tracking-tight">
                Built with security<br />
                <span className="text-brand-400">at every layer</span>
              </h2>
              <p className="text-xl text-dark-300 font-medium max-w-2xl mx-auto">
                Your financial data is protected by multiple layers of security — from authentication to role-based access control.
              </p>
            </FadeInSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: KeyRound,
                  title: "JWT Authentication",
                  desc: "Access and refresh tokens with automatic expiry. Secure login with token rotation.",
                  color: "text-brand-400",
                  bg: "bg-brand-600/15 border-brand-500/30",
                },
                {
                  icon: Users,
                  title: "Role-Based Access",
                  desc: "5 distinct roles — Personal, SME Owner, Accountant, Manager, Employee — each with tailored permissions.",
                  color: "text-blue-400",
                  bg: "bg-blue-600/15 border-blue-500/30",
                },
                {
                  icon: ShieldCheck,
                  title: "Data Isolation",
                  desc: "Each business's data is strictly isolated. Team members can only access their own workspace.",
                  color: "text-emerald-400",
                  bg: "bg-emerald-600/15 border-emerald-500/30",
                },
                {
                  icon: FileText,
                  title: "Audit Controls",
                  desc: "Every transaction is timestamped and traceable. Accountants and managers have read-only views.",
                  color: "text-amber-400",
                  bg: "bg-amber-600/15 border-amber-500/30",
                },
              ].map((item, i) => (
                <FadeInSection key={i} delay={i * 0.1}>
                  <div className={`p-8 rounded-2xl border ${item.bg} h-full`}>
                    <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-3">{item.title}</h3>
                    <p className="text-dark-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* PRIVACY AND POLICY SECTION */}
        <section id="privacy" className="py-28 px-6 lg:px-12 max-w-[1400px] mx-auto relative z-10">
          <FadeInSection className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 text-brand-600 dark:text-brand-400 text-sm font-bold mb-6">
              <ShieldCheck className="w-4 h-4" /> Privacy & Policy
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight dark:text-white">
              Your financial data stays<br />
              <span className="text-brand-600">private, protected, and controlled.</span>
            </h2>
            <p className="text-xl text-dark-600 dark:text-dark-300 font-medium leading-relaxed">
              FinanceAI is designed for sensitive SME and personal finance records. The platform uses clear data rules, secure access, and responsible AI handling so users understand how their information is protected.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: 'Data Protection',
                desc: 'Income, expense, budget, goal, and report data are connected only to the authenticated account or workspace. Users should not be able to access another user’s financial records.',
              },
              {
                icon: Shield,
                title: 'Responsible AI Use',
                desc: 'AI features are used to explain financial patterns and provide general guidance. They do not replace professional accounting, tax, legal, or financial advice.',
              },
              {
                icon: FileText,
                title: 'Newsletter Consent',
                desc: 'Newsletter emails are collected only when a visitor subscribes. Subscription data is stored for FinanceAI updates and admin notification purposes only.',
              },
            ].map((item, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className="glass-card dark:bg-dark-800/80 dark:border-dark-700/50 p-8 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50 flex items-center justify-center mb-6">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 dark:text-white">{item.title}</h3>
                  <p className="text-dark-600 dark:text-dark-300 leading-relaxed">{item.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-32 px-6 lg:px-12 max-w-[1400px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <FadeInSection>
              <h2 className="text-5xl font-extrabold mb-8 tracking-tight dark:text-white">
                Always with<br />FinanceAI
              </h2>
              <div className="space-y-12 mt-12">
                {[
                  { step: "01", title: "Get what you need the most", desc: "Tailored financial management tools designed for SMEs and personal finance. Built with real-world workflows in mind." },
                  { step: "02", title: "Save your time and money",   desc: "Automate transaction tracking, budget monitoring, and gap detection — so you focus on running your business." },
                  { step: "03", title: "Make changes easily",        desc: "Add team members, assign roles, and adjust permissions any time — no technical expertise needed." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-brand-500 dark:text-brand-400 font-mono font-bold text-xl pt-1">{item.step}</div>
                    <div>
                      <h4 className="text-2xl font-bold mb-2 dark:text-white">{item.title}</h4>
                      <p className="text-dark-500 dark:text-dark-400 text-lg">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInSection>

            {/* Phone mockup */}
            <FadeInSection delay={0.2} className="relative h-[600px] hidden lg:block perspective-1000">
              <motion.div
                animate={{ rotateY: [0, 5, 0], y: [-10, 10, -10] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-[320px] h-[650px] bg-dark-800 rounded-[3rem] border-[8px] border-dark-950 shadow-2xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-white dark:bg-dark-900 transition-colors">
                    <div className="bg-brand-600 h-44 rounded-b-3xl p-6 text-white pt-10">
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-white/20" />
                        <div className="w-8 h-8 rounded-full bg-white/20" />
                      </div>
                      <div className="text-sm opacity-80 mb-1">Total Balance</div>
                      <div className="text-3xl font-bold">$124,590.00</div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex gap-4 mb-6">
                        <div className="flex-1 h-12 bg-gray-100 dark:bg-dark-800 rounded-xl transition-colors" />
                        <div className="flex-1 h-12 bg-gray-100 dark:bg-dark-800 rounded-xl transition-colors" />
                      </div>
                      <div className="text-sm font-bold text-dark-900 dark:text-white mb-2 text-left">Recent Transactions</div>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-dark-800 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-50 dark:border-dark-700/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30" />
                            <div>
                              <div className="h-4 w-24 bg-gray-200 dark:bg-dark-700 rounded mb-1" />
                              <div className="h-3 w-16 bg-gray-100 dark:bg-dark-600 rounded" />
                            </div>
                          </div>
                          <div className="h-4 w-12 bg-gray-200 dark:bg-dark-700 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeInSection>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-32 px-6 lg:px-12 max-w-[1400px] mx-auto text-center relative z-10">
          <FadeInSection>
            <h2 className="text-5xl lg:text-7xl font-extrabold mb-8 tracking-tight text-dark-900 dark:text-white">
              Run your Business<br />
              <span className="text-brand-600">with FinanceAI.</span>
            </h2>
            <p className="text-xl text-dark-600 dark:text-dark-300 mb-12 max-w-2xl mx-auto font-medium">
              Join businesses managing their finances intelligently with AI-powered tools and real-time insights.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-dark-900 text-white dark:bg-white dark:text-dark-900 rounded-full font-bold text-lg hover:bg-brand-600 dark:hover:bg-brand-600 dark:hover:text-white transition-all shadow-xl hover:-translate-y-1">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </FadeInSection>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-dark-950 text-white pt-20 pb-10 relative z-10 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

          {/* Newsletter */}
          <div className="bg-brand-600 rounded-3xl p-12 mb-20 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="z-10">
              <h3 className="text-3xl font-bold mb-2">Get the latest FinanceAI news<br />straight to your inbox</h3>
              {subSuccess && (
                <p className="mt-3 text-sm font-semibold text-green-200 flex items-center gap-2">
                  <span>✅</span> {subSuccess}
                </p>
              )}
              {subError && (
                <p className="mt-3 text-sm font-semibold text-red-200 flex items-center gap-2">
                  <span>⚠️</span> {subError}
                </p>
              )}
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto z-10">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                disabled={subLoading}
                className="px-6 py-4 rounded-l-full w-full lg:w-80 text-dark-900 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={subLoading}
                className="bg-dark-900 text-white px-8 py-4 rounded-r-full font-bold hover:bg-dark-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {subLoading ? 'Sending…' : 'Subscribe'}
              </button>
            </form>
          </div>

          {/* Footer columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20 text-sm">
            <div className="col-span-2 md:col-span-1">
              <span className="font-bold text-2xl tracking-tight mb-4 block">FinanceAI</span>
              <p className="text-dark-400 mb-2">AI-powered financial management</p>
              <p className="text-dark-400 mb-2">for businesses and individuals.</p>
              <p className="text-dark-400 mt-4">contact@financeai.com</p>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Platform</h4>
              <ul className="space-y-4 text-dark-400">
                <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('security')} className="hover:text-white transition-colors">Security</button></li>
                <li><button onClick={() => scrollTo('privacy')}  className="hover:text-white transition-colors">Privacy & Policy</button></li>
                <li><button onClick={() => scrollTo('about')}    className="hover:text-white transition-colors">About</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Access</h4>
              <ul className="space-y-4 text-dark-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/login"    className="hover:text-white transition-colors">Log In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Roles</h4>
              <ul className="space-y-4 text-dark-400">
                <li className="text-dark-500">SME Owner</li>
                <li className="text-dark-500">Personal User</li>
                <li className="text-dark-500">Accountant</li>
                <li className="text-dark-500">Manager</li>
                <li className="text-dark-500">Employee</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-dark-500 text-xs font-medium">
            <p>© 2026 FINANCEAI. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span>Final Year Project</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
