import React from 'react';

export function BrandLogoSymbol({ className = "w-8 h-8", size = 32 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 36 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="ciq-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="40%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="ciq-grad-inner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFEDD5" />
        </linearGradient>
        <filter id="ciq-soft-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#EA580C" floodOpacity="0.3" />
        </filter>
      </defs>
      
      {/* Main Outer Geometric Rounded Badge */}
      <rect x="2" y="2" width="32" height="32" rx="9" fill="url(#ciq-grad-main)" filter="url(#ciq-soft-glow)" />
      
      {/* Precision Geometric Signal Lattice */}
      {/* Connector lines forming interlocking intelligence diamond */}
      <path d="M11 18 L18 11 L25 18 L18 25 Z" stroke="#FFFFFF" strokeWidth="1.75" strokeLinejoin="round" opacity="0.6" />
      <path d="M18 11 L18 25" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="1.5 1.5" opacity="0.75" />
      <path d="M11 18 L25 18" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.75" />

      {/* Signal Nodes */}
      {/* Top Node */}
      <circle cx="18" cy="11" r="2.25" fill="url(#ciq-grad-inner)" />
      {/* Left Node */}
      <circle cx="11" cy="18" r="2.25" fill="url(#ciq-grad-inner)" />
      {/* Right Node */}
      <circle cx="25" cy="18" r="2.25" fill="url(#ciq-grad-inner)" />
      {/* Bottom Node */}
      <circle cx="18" cy="25" r="2.25" fill="url(#ciq-grad-inner)" />

      {/* Core Intelligence Hub */}
      <circle cx="18" cy="18" r="4.2" fill="#FFFFFF" />
      <circle cx="18" cy="18" r="2" fill="#EA580C" />
    </svg>
  );
}

export function BrandWordmark({ className = "" }) {
  return (
    <div className={`font-sans tracking-tight leading-none select-none ${className}`}>
      <span className="font-bold text-slate-900 text-[17px] tracking-[-0.025em]">Competitor</span>
      <span className="font-extrabold text-[#EA580C] text-[18px] tracking-[0.01em] ml-0.5">IQ</span>
    </div>
  );
}

export function BrandHeader({ onClick, className = "" }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <BrandLogoSymbol size={34} />
      </div>
      <div className="flex flex-col justify-center">
        <BrandWordmark />
        <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
          Enterprise Intelligence
        </span>
      </div>
    </div>
  );
}

export default BrandLogoSymbol;
