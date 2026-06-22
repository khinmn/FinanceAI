import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Shield, Target, TrendingUp, Users, CheckCircle2, DollarSign, Brain, BarChart3, Fingerprint } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-softGray relative overflow-hidden font-sans text-dark-900">
      {/* Background ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-200/50 blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-200/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-cyan-200/30 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-20 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-dark-900 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin-slow" />
          </div>
          <span className="font-bold text-xl tracking-tight">FinanceAI<span className="text-primary-500 text-2xl leading-none relative top-0.5">+</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-dark-600">
          <a href="#" className="text-dark-900 font-semibold">Home</a>
          <a href="#features" className="hover:text-dark-900 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-dark-900 transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-dark-900 transition-colors">Pricing</a>
          <a href="#about" className="hover:text-dark-900 transition-colors">About</a>
        </div>

        <Link to="/login" className="px-6 py-2.5 bg-dark-900 text-white text-sm font-medium rounded-full hover:bg-dark-800 transition-all shadow-lg hover:shadow-xl">
          Get Started
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-20 pt-12 pb-24">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white/80 shadow-sm text-sm font-medium text-dark-600 mb-8"
            >
              <span className="text-primary-500">✦</span> AI-Powered Finance Management
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-[64px] leading-[1.1] font-bold tracking-tight mb-6"
            >
              AI-Powered<br />
              Financial Intelligence<br />
              <span className="text-primary-500">for SMEs & MSMEs</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-dark-600 mb-10 max-w-lg leading-relaxed"
            >
              Track finances, analyze gaps, and get AI-driven insights to grow your business smarter.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mb-16"
            >
              <Link to="/register" className="flex items-center gap-2 px-8 py-4 bg-dark-900 text-white rounded-full font-medium hover:bg-dark-800 transition-all shadow-lg hover:shadow-xl group">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="flex items-center gap-2 px-8 py-4 bg-white/80 border border-dark-100 rounded-full font-medium hover:bg-white transition-all shadow-sm">
                <div className="w-6 h-6 rounded-full bg-dark-100 flex items-center justify-center">
                  <Play className="w-3 h-3 text-dark-900 ml-0.5" />
                </div>
                Watch Demo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-dark-900">500+</div>
                  <div className="text-xs text-dark-500">Businesses</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-dark-900">98.5%</div>
                  <div className="text-xs text-dark-500">Accuracy</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-dark-900">24/7</div>
                  <div className="text-xs text-dark-500">AI Support</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Visuals (Floating Cards) */}
          <div className="relative h-[600px] w-full hidden lg:block perspective-1000">
            {/* Main Financial Overview Card */}
            <motion.div
              initial={{ opacity: 0, x: 50, y: 20, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, y: 0, rotateY: -5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-10 right-0 w-[500px] glass-panel p-6 z-20"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-sm text-dark-900">Financial Overview</h3>
                <span className="text-xs px-2 py-1 bg-dark-100 rounded text-dark-600">This Month</span>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div>
                  <div className="text-[10px] text-dark-500 mb-1">Total Income</div>
                  <div className="font-bold text-sm">$24,580</div>
                  <div className="text-[10px] text-success flex items-center mt-1">+12.5% <TrendingUp className="w-3 h-3 ml-1" /></div>
                </div>
                <div>
                  <div className="text-[10px] text-dark-500 mb-1">Total Expenses</div>
                  <div className="font-bold text-sm">$16,420</div>
                  <div className="text-[10px] text-danger flex items-center mt-1">-8.3% <TrendingUp className="w-3 h-3 ml-1 transform rotate-180" /></div>
                </div>
                <div>
                  <div className="text-[10px] text-dark-500 mb-1">Net Balance</div>
                  <div className="font-bold text-sm">$8,160</div>
                  <div className="text-[10px] text-success flex items-center mt-1">+18.7% <TrendingUp className="w-3 h-3 ml-1" /></div>
                </div>
                <div className="text-center border-l border-dark-100 pl-2">
                  <div className="text-[10px] text-dark-500 mb-1">Health Score</div>
                  <div className="font-bold text-sm">82<span className="text-dark-400 text-[10px]">/100</span></div>
                  <div className="text-[10px] text-success mt-1">Good</div>
                </div>
              </div>

              <div className="flex gap-6">
                {/* Dummy Bar Chart */}
                <div className="flex-1">
                  <div className="text-[10px] text-dark-600 mb-4 font-medium">Income vs Expenses</div>
                  <div className="h-24 flex items-end justify-between gap-1">
                    {[40, 60, 30, 80, 50, 70].map((h, i) => (
                      <div key={i} className="flex gap-0.5 items-end">
                        <div className="w-2 bg-primary-500 rounded-t-sm" style={{ height: `${h}%` }} />
                        <div className="w-2 bg-purple-200 rounded-t-sm" style={{ height: `${h * 0.7}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Dummy Donut Chart */}
                <div className="w-1/3">
                  <div className="text-[10px] text-dark-600 mb-4 font-medium">Expenses by Category</div>
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-[6px] border-primary-500 border-r-purple-300 border-b-cyan-300" />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xs">$16,420</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Recommendation Floating Card */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 100 }}
              animate={{ opacity: 1, x: -30, y: 280 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="absolute right-0 w-[240px] glass-panel p-4 z-30 shadow-xl border-white/60 bg-white/80"
              style={{ transform: 'rotateZ(-2deg)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center">
                  <Brain className="w-3 h-3 text-primary-600" />
                </div>
                <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider">AI Recommendation</span>
              </div>
              <p className="text-xs text-dark-600 leading-relaxed mb-3">
                Your food expenses increased by 18% this month. Consider reducing dining out.
              </p>
              <button className="text-[10px] w-full py-1.5 rounded-lg bg-primary-500/10 text-primary-600 font-medium hover:bg-primary-500/20 transition-colors">
                View Details →
              </button>
            </motion.div>

            {/* Bubble 1 */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-10 w-24 h-24 rounded-full bg-gradient-to-tr from-white/40 to-white/10 backdrop-blur-md border border-white/50 shadow-glass z-10"
            />
            {/* Bubble 2 */}
            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 right-[-20px] w-16 h-16 rounded-full bg-gradient-to-tr from-purple-200/40 to-white/10 backdrop-blur-md border border-white/50 shadow-glass z-10"
            />
          </div>
        </div>

        {/* Partners */}
        <div className="mt-20 border-t border-dark-100 pt-8 flex items-center justify-center gap-12 text-dark-400 grayscale opacity-60">
          <span className="font-bold text-xl flex items-center gap-2"><Target className="w-6 h-6"/> StartUpHub</span>
          <span className="font-bold text-xl flex items-center gap-2"><Shield className="w-6 h-6"/> TechCorp</span>
          <span className="font-bold text-xl flex items-center gap-2"><TrendingUp className="w-6 h-6"/> BizGrowth</span>
          <span className="font-bold text-xl flex items-center gap-2"><Fingerprint className="w-6 h-6"/> LaunchPad</span>
        </div>

        {/* Features Section */}
        <div className="mt-32">
          <div className="max-w-xl mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to<br/>Manage Finance <span className="text-primary-500">Smarter</span></h2>
            <p className="text-dark-600">Powerful features to track, analyze and improve your business finances with AI.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI Assistant", desc: "Get intelligent insights and recommendations for better decisions.", color: "text-purple-500", bg: "bg-purple-100" },
              { icon: BarChart3, title: "Smart Dashboard", desc: "Real-time overview of income, expenses, budget and financial health.", color: "text-blue-500", bg: "bg-blue-100" },
              { icon: Target, title: "Gap Analysis", desc: "Identify financial gaps and get actionable recommendations.", color: "text-green-500", bg: "bg-green-100" },
              { icon: DollarSign, title: "Budget Management", desc: "Plan, track and manage budgets effectively across categories.", color: "text-orange-500", bg: "bg-orange-100" },
              { icon: TrendingUp, title: "Reports & Analytics", desc: "Generate professional reports and export in multiple formats.", color: "text-indigo-500", bg: "bg-indigo-100" },
              { icon: Shield, title: "Role-Based Access", desc: "Secure access for owners, staff, accountants and admins.", color: "text-rose-500", bg: "bg-rose-100" },
            ].map((f, i) => (
              <div key={i} className="glass-card p-6">
                <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-dark-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works Section */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold mb-2">How FinanceAI Works</h2>
          <p className="text-dark-600 mb-16">Simple steps to transform your financial management</p>
          
          <div className="flex justify-between items-start max-w-4xl mx-auto relative">
            <div className="absolute top-6 left-0 right-0 h-[2px] bg-dark-100 -z-10" />
            {[
              { step: 1, title: "Sign Up", desc: "Create your account and choose your role", icon: Users },
              { step: 2, title: "Add Financial Data", desc: "Upload transactions, budgets and expenses", icon: DollarSign },
              { step: 3, title: "AI Analysis", desc: "Our AI analyzes your data and identifies gaps", icon: Brain },
              { step: 4, title: "Get Insights", desc: "Receive actionable insights and reports", icon: BarChart3 },
              { step: 5, title: "Grow Business", desc: "Make better decisions and grow your business", icon: Target },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center max-w-[140px] bg-softGray px-2">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-primary-100 flex items-center justify-center mb-4 text-primary-500 shadow-sm">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-dark-400 mb-1">{s.step}. {s.title}</div>
                <p className="text-[10px] text-dark-500 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
