import React from 'react';
import { ShieldCheck, Cpu, Zap, Activity, BrainCircuit, ArrowUpRight } from 'lucide-react';
import { BrandHeader } from '../components/common/BrandLogo';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] font-sans antialiased text-slate-800">
      {/* Left Form Column */}
      <div className="w-full lg:w-[50%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-8 lg:p-12 xl:p-16 bg-white border-r border-stone-200/80 z-10 min-h-screen shadow-2xs">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <BrandHeader />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-bold text-orange-600">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
              Platform v2.4 Live
            </div>
          </div>

          {/* Form Header */}
          {(title || subtitle) && (
            <div className="mb-6 space-y-1.5">
              {title && <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>}
              {subtitle && <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{subtitle}</p>}
            </div>
          )}

          {/* Form Content */}
          {children}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div>© {new Date().getFullYear()} CompetitorIQ Inc. All rights reserved.</div>
          <div className="flex items-center gap-4 text-[11px] font-medium">
            <a href="#privacy" className="hover:text-slate-700 transition">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" className="hover:text-slate-700 transition">Terms of Service</a>
            <span>•</span>
            <a href="#security" className="hover:text-slate-700 transition">SOC2 Type II</a>
          </div>
        </div>
      </div>

      {/* Right Product Showcase Column matching light classic theme */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-stone-50 via-orange-50/20 to-amber-50/30 p-12 xl:p-16 flex-col justify-between overflow-hidden text-slate-800 border-l border-stone-100">
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-orange-600 shadow-2xs">
            <Cpu className="w-3.5 h-3.5 text-orange-600" />
            <span>Autonomous Intelligence Synthesis Network</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-slate-500 font-semibold">100% Signal Sync</span>
          </div>
        </div>

        {/* Center Visual Feature Showcase */}
        <div className="relative z-10 my-auto max-w-xl space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 tracking-wider uppercase">
              <Zap className="w-4 h-4" /> Enterprise Competitor Tracking
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Turn market noise into decisive strategic advantage.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed font-normal">
              Synthesize 24+ active competitor tracks, real-time pricing shifts, patent filings, and hiring velocity into persistent vector memory.
            </p>
          </div>

          {/* Interactive Mock Intelligence Stream Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-xs">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-slate-900">Live Intel Stream</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Confidence: 98.4%
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-stone-200/80 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-900 font-bold">
                    <span>Oracle Cloud Strategy Shift</span>
                    <span className="text-[10px] text-slate-400 font-mono">12m ago</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Reallocated 35% engineering headcount to Sovereign Cloud APIs following patent #2024-0192849.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-stone-200/80 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-900 font-bold">
                    <span>Pricing Offensive Detected</span>
                    <span className="text-[10px] text-slate-400 font-mono">1h ago</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    CloudMind updated Enterprise tier minimum seat count from 50 to 100 with hidden migration discounts.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-stone-100">
              <span className="flex items-center gap-1 text-orange-600 font-bold">
                12,842 indexed strategic memories <ArrowUpRight className="w-3 h-3" />
              </span>
              <span className="font-semibold text-slate-400">CompetitorIQ Enterprise</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Row */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-stone-200/60 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SOC2 Type II Certified & End-to-End Encrypted</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Hindsight Memory Core
          </div>
        </div>
      </div>
    </div>
  );
}
