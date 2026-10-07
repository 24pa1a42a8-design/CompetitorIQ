import React from 'react';
import { ShieldCheck, Cpu, Zap, Activity, BrainCircuit, GitBranch, ArrowUpRight, TrendingUp } from 'lucide-react';
import CompetitorIQLogo from '../components/common/CompetitorIQLogo';
import CompetitorLogo from '../components/common/CompetitorLogo';

export default function AuthLayout({ children, title = "Welcome back", subtitle = "Sign in to continue to CompetitorIQ" }) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] font-sans antialiased text-slate-800">
      
      {/* ── LEFT PANEL: Brand & Visual Intelligence Section ── */}
      <div className="w-full lg:w-[50%] xl:w-[48%] bg-slate-900 text-white p-8 sm:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-slate-800">
        
        {/* Subtle background mesh grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CompetitorIQLogo size={44} className="border border-white/20 shadow-md" />
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-xl tracking-tight leading-none">Competitor<span className="text-[#EA580C]">IQ</span></span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">Enterprise Intelligence</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Intelligence Core v2.4
          </div>
        </div>

        {/* Main Hero & Strategic Visual */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/70 border border-orange-700/50 text-[11px] font-bold text-orange-400 tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5" /> Market Signal Synthesis
            </div>
            
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Remember every move.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200">
                Understand the strategy.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
              AI-powered competitive intelligence that transforms market signals into strategic decisions.
            </p>
          </div>

          {/* Minimal Elegant Intelligence Diagram Card */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <BrainCircuit className="w-4 h-4 text-orange-400" />
                <span>Active Ecosystem Mesh</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 rounded font-semibold">
                PostgreSQL Grounded
              </span>
            </div>

            {/* Connected Focal Competitor Nodes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/90 border border-orange-500/40 p-3 rounded-xl flex items-center gap-2.5">
                <CompetitorLogo name="Microsoft" size={18} />
                <div className="text-[11px]">
                  <div className="font-bold text-white">Microsoft</div>
                  <div className="text-[9px] text-orange-400 font-semibold">Focal Target</div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/60 p-3 rounded-xl flex items-center gap-2.5">
                <CompetitorLogo name="AWS" size={18} />
                <div className="text-[11px]">
                  <div className="font-bold text-slate-300">AWS</div>
                  <div className="text-[9px] text-slate-400">92 Signals</div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/60 p-3 rounded-xl flex items-center gap-2.5">
                <CompetitorLogo name="Google Cloud" size={18} />
                <div className="text-[11px]">
                  <div className="font-bold text-slate-300">Google Cloud</div>
                  <div className="text-[9px] text-slate-400">84 Signals</div>
                </div>
              </div>
            </div>

            {/* Signal Lattice Stats */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-mono border-t border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-300 font-sans font-semibold">
                <GitBranch className="w-3.5 h-3.5 text-orange-400" />
                <span>Connect the Dots Lattice</span>
              </div>
              <span className="text-orange-400 font-bold">128 Grounded Chains</span>
            </div>
          </div>
        </div>

        {/* Left Footer Trust Badge */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SOC2 Type II Certified & Enterprise Encrypted</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Hindsight Memory System</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login Form Container ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 xl:p-20 bg-white min-h-screen">
        
        {/* Mobile top logo header */}
        <div className="flex lg:hidden items-center justify-between mb-8 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <CompetitorIQLogo size={36} />
            <div>
              <span className="font-extrabold text-slate-900 text-lg">Competitor<span className="text-[#EA580C]">IQ</span></span>
              <span className="block text-[9px] font-bold text-slate-400 uppercase">Enterprise Intelligence</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          
          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{subtitle}</p>
          </div>

          {/* Form Children */}
          {children}

        </div>

        {/* Right Footer */}
        <div className="w-full max-w-md mx-auto mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div>© {new Date().getFullYear()} CompetitorIQ Inc. All rights reserved.</div>
          <div className="flex items-center gap-4 text-[11px] font-medium">
            <a href="#privacy" className="hover:text-slate-700 transition">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" className="hover:text-slate-700 transition">Terms of Service</a>
          </div>
        </div>

      </div>

    </div>
  );
}
