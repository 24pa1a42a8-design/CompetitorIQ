import React from 'react';
import CompetitorIQLogo from './CompetitorIQLogo';

export function BrandLogoSymbol({ className = "", size = 34 }) {
  return (
    <CompetitorIQLogo size={size} className={className} />
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
        <CompetitorIQLogo size={34} />
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

export { CompetitorIQLogo };
export default CompetitorIQLogo;

