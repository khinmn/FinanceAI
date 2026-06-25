import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Target, TrendingUp, CheckCircle2, DollarSign, Brain, BarChart3, Fingerprint, Lock, Zap, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// Reusable animated section wrapper
const FadeInSection = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const { darkMode, setDarkMode } = useAuthStore();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const mockupY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-dark-900 transition-colors duration-300 relative overflow-hidden font-sans text-dark-900 dark:text-white selection:bg-brand-500/20" ref={containerRef}>
      
      {/* --- BACKGROUND BLOBS --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top left purple blob */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-brand-400/20 dark:bg-brand-500/10 blur-[120px] mix-blend-multiply animate-blob" />
        {/* Top right blue blob */}
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-blue-400/20 dark:bg-indigo-500/10 blur-[120px] mix-blend-multiply animate-blob-reverse" style={{ animationDelay: '2s' }} />
        {/* Bottom center indigo blob */}
        <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-indigo-400/15 dark:bg-brand-500/5 blur-[150px] mix-blend-multiply animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/50 dark:bg-dark-900/50 backdrop-blur-md border-b border-white/20 dark:border-dark-800/40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dark-900 dark:bg-brand-600 flex items-center justify-center shadow-lg">
              <div className="w-5 h-5 rounded-full border-2 border-brand-400 border-t-transparent animate-spin-slow" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-dark-900 dark:text-white">FinanceAI<span className="text-brand-500">.</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-dark-600 dark:text-dark-400">
            <a href="#home" className="text-dark-900 dark:text-white transition-colors">Platform</a>
            <a href="#features" className="hover:text-dark-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#insights" className="hover:text-dark-900 dark:hover:text-white transition-colors">AI Insights</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode?.(darkMode === true ? false : true)}
              className="p-2 rounded-full hover:bg-brand-50 dark:hover:bg-dark-800 text-dark-500 hover:text-brand-600 dark:text-dark-400 dark:hover:text-brand-400 transition-colors border border-transparent hover:border-brand-100/50"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
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
        
        {/* --- HERO SECTION --- */}
        <section id="home" className="relative pt-40 pb-12 lg:pt-48 lg:pb-16 px-6 lg:px-12 max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-10 xl:gap-16 min-h-[90vh]">
          
          {/* Hero Content */}
          <motion.div 
            className="flex-1 w-full"
            style={{ y: heroY, opacity: opacityFade }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm text-sm font-bold text-brand-700 mb-8"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
              </span>
              Intelligent Financial Management
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-5xl lg:text-[48px] xl:text-[60px] 2xl:text-[72px] leading-[1.05] font-extrabold tracking-[-0.03em] mb-8 text-dark-900"
            >
              Core Finance<br />
              Management<br />
              <span className="text-gradient">for Businesses.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-xl text-dark-600 mb-12 max-w-xl font-medium leading-relaxed"
            >
              End-to-end AI financial platform. Automate tracking, uncover gaps, and accelerate your business growth with enterprise-grade intelligence.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link to="/register" className="flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-full font-bold text-lg hover:bg-brand-500 transition-all shadow-[0_8px_30px_rgb(139,92,246,0.3)] hover:shadow-[0_8px_40px_rgb(139,92,246,0.5)] hover:-translate-y-1 group">
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-dark-900 text-dark-900 rounded-full font-bold text-lg hover:bg-dark-900 hover:text-white transition-all shadow-sm hover:-translate-y-1">
                Log In
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Visuals (CSS Dashboard Mockup) */}
          <motion.div 
            className="flex-1 w-full relative perspective-[2000px] h-[600px] hidden lg:block"
            style={{ y: mockupY }}
          >
            <div className="absolute top-0 left-0 origin-top-left w-[800px] h-[550px] lg:scale-[0.55] xl:scale-[0.7] 2xl:scale-[0.85] transition-transform duration-300">
              <motion.div
                initial={{ opacity: 0, rotateY: 10, rotateX: 5, scale: 0.9, x: 60 }}
                animate={{ opacity: 1, rotateY: -15, rotateX: 5, scale: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute inset-0 bg-white dark:bg-dark-800 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-dark-700/80 overflow-hidden transition-all duration-300"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Mockup Sidebar */}
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
                
                {/* Mockup Main Content */}
                <div className="absolute left-64 right-0 top-0 bottom-0 bg-[#F9FAFB] dark:bg-dark-900 p-8 transition-colors duration-300">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <div className="h-4 w-32 bg-gray-200 dark:bg-dark-700 rounded mb-2" />
                      <div className="h-8 w-48 bg-dark-900 dark:bg-white rounded" />
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-dark-800 shadow-sm border border-transparent dark:border-dark-700" />
                      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30" />
                    </div>
                  </div>
 
                  {/* Cards Row */}
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
                            <div key={b} className={`flex-1 ${card.bar} rounded-t-sm opacity-${b%2 ? '100' : '50'} ${card.h}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
 
                  {/* Main Graph Area */}
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

              {/* Floating Elements Over Mockup */}
              <motion.div 
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-10 top-20 w-48 p-4 glass-panel z-20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success"><CheckCircle2 className="w-4 h-4"/></div>
                  <div className="text-sm font-bold">Transfer complete</div>
                </div>
                <div className="text-xl font-extrabold">+ $24,500</div>
              </motion.div>

              <motion.div 
                animate={{ y: [15, -15, 15] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-10 bottom-10 w-56 p-5 glass-panel z-20 border-brand-200/30"
              >
                <div className="text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">AI Insight</div>
                <div className="text-sm text-dark-800 font-medium leading-snug">
                  Your runway extended by 2 months based on recent optimizations.
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>


        {/* --- FEATURES GRID --- */}
        <section id="features" className="py-12 px-6 lg:px-12 max-w-[1400px] mx-auto relative z-10">
          <FadeInSection className="max-w-2xl mb-12">
            <h2 className="text-5xl font-extrabold mb-6 tracking-tight dark:text-white">
              Core functionality – <br/>
              <span className="text-brand-600">everything you need</span>
            </h2>
            <p className="text-xl text-dark-600 dark:text-dark-300 font-medium">
              A complete suite of financial tools integrated into one single platform, powered by advanced artificial intelligence.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "AI Analytics Engine", desc: "Automated insights, anomaly detection, and predictive forecasting for your cash flow.", color: "bg-brand-50 text-brand-600" },
              { icon: Target, title: "Gap Analysis", desc: "Identify inefficiencies in spending and get actionable recommendations to improve margins.", color: "bg-blue-50 text-blue-600" },
              { icon: DollarSign, title: "Smart Budgeting", desc: "Dynamic budget allocation that learns from your spending habits and adjusts in real-time.", color: "bg-emerald-50 text-emerald-600" },
              { icon: Lock, title: "Enterprise Security", desc: "Bank-grade encryption, role-based access control, and comprehensive audit logs.", color: "bg-slate-100 text-slate-700" },
              { icon: Zap, title: "Real-time Sync", desc: "Connect multiple accounts and see all your transactions updated instantly.", color: "bg-amber-50 text-amber-600" },
              { icon: BarChart3, title: "Custom Reports", desc: "Generate pixel-perfect financial reports for stakeholders with a single click.", color: "bg-pink-50 text-pink-600" },
            ].map((f, i) => (
              <FadeInSection key={i} delay={i * 0.07}>
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

        {/* --- INFO / VALUES SECTION --- */}
        <section id="insights" className="py-12 relative overflow-hidden bg-dark-900 text-white rounded-[3rem] mx-4 lg:mx-12 my-6 shadow-2xl">
          {/* Internal blobs for dark section */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px]" />

          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
            <FadeInSection>
              <h2 className="text-5xl font-extrabold mb-8 tracking-tight leading-tight">
                Always with <br/>FinanceAI
              </h2>
              
              <div className="space-y-8 mt-8">
                {[
                  { step: "01", title: "Smart AI Financial Assistant", desc: "Interact with an intelligence engine that reviews transaction histories, updates budget forecasts, and offers saving insights." },
                  { step: "02", title: "Automated Gap & Anomaly Checks", desc: "Run margin audits to surface recurring SaaS subscription updates, spending leaks, and cash flow alerts." },
                  { step: "03", title: "Visual Saving Goals", desc: "Define milestone targets, track progress dynamically, and build savings timelines with auto-adjusting monthly metrics." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-brand-400 font-mono font-bold text-xl pt-1">{item.step}</div>
                    <div>
                      <h4 className="text-2xl font-bold mb-2">{item.title}</h4>
                      <p className="text-dark-400 text-lg">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInSection>

            <FadeInSection delay={0.2} className="relative h-[600px] hidden lg:block perspective-1000">
              {/* Abstract 3D composition representing mobile app */}
              <motion.div 
                animate={{ rotateY: [0, 5, 0], y: [-10, 10, -10] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-[320px] h-[650px] bg-dark-800 rounded-[3rem] border-[8px] border-dark-950 shadow-2xl overflow-hidden relative">
                  {/* Phone screen UI */}
                  <div className="absolute inset-0 bg-white dark:bg-dark-900 transition-colors">
                    <div className="bg-brand-600 h-[190px] rounded-b-3xl p-6 text-white pt-8 shadow-inner relative overflow-hidden flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-2">
                        <div className="w-10 h-10 rounded-full bg-white/20" />
                        <div className="w-8 h-8 rounded-full bg-white/20" />
                      </div>
                      <div className="mt-auto text-left pb-4">
                        <div className="text-xs opacity-80 uppercase tracking-wider font-bold">Total Balance</div>
                        <div className="text-3xl font-black mt-1">$124,590.00</div>
                      </div>
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

        {/* --- CTA SECTION --- */}
        <section className="py-16 px-6 lg:px-12 max-w-[1400px] mx-auto text-center relative z-10">
          <FadeInSection>
            <h2 className="text-5xl lg:text-7xl font-extrabold mb-8 tracking-tight">
              Run your Business<br />
              <span className="text-brand-600">with FinanceAI.</span>
            </h2>
            <p className="text-xl text-dark-600 mb-12 max-w-2xl mx-auto font-medium">
              Join hundreds of forward-thinking businesses managing their finances intelligently.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-dark-900 text-white rounded-full font-bold text-lg hover:bg-brand-600 transition-all shadow-xl hover:-translate-y-1">
              Get Started for Free <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </FadeInSection>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-dark-950 text-white pt-12 pb-8 relative z-10 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          
          <div className="bg-brand-600 rounded-3xl p-12 mb-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <h3 className="text-3xl font-bold z-10">Get the latest FinanceAI news<br/>straight to your inbox</h3>
            <div className="flex w-full lg:w-auto z-10">
              <input type="email" placeholder="Enter your email" className="px-6 py-4 rounded-l-full w-full lg:w-80 text-dark-900 focus:outline-none" />
              <button className="bg-dark-900 text-white px-8 py-4 rounded-r-full font-bold hover:bg-dark-800 transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-12 mb-12 text-sm">
            <div className="col-span-2 lg:col-span-1">
              <span className="font-bold text-2xl tracking-tight mb-6 block">FinanceAI<span className="text-brand-500">.</span></span>
              <p className="text-gray-300 mb-2">Yangon, Myanmar</p>
              <p className="text-gray-300 mt-6">support@financeai.com</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-white">Features</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Transactions Ledger</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Budget Overview</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">AI Assistant Chat</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Gap Analysis Reports</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-white">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Compliance</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security Standards</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-400 text-xs font-medium">
            <p>© 2026 FINANCEAI. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">LinkedIn</a>
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
