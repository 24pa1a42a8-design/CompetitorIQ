import React from 'react';
import logoImg from '../../assets/competitoriq-logo.png';

/**
 * CompetitorIQLogo Component
 * Official brand logo component using the provided I-RRR emblem asset.
 * Preserves natural aspect ratio, prevents distortion, and supports clean sizing across the app.
 */
export function CompetitorIQLogo({ size = 36, height, className = '', alt = "CompetitorIQ", onClick, showText = false }) {
  const calcSize = height || size;
  const pixelSize = typeof calcSize === 'number' ? `${calcSize}px` : calcSize;

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2 shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div 
        className="rounded-full overflow-hidden shrink-0 shadow-2xs border border-orange-500/30 bg-orange-600 flex items-center justify-center transition-transform duration-200 hover:scale-[1.03]"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <img
          src={logoImg}
          alt={alt}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      {showText && (
        <div className="flex flex-col justify-center leading-none select-none">
          <span className="font-extrabold text-slate-900 text-[16px] tracking-tight">Competitor<span className="text-[#EA580C]">IQ</span></span>
          <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">Enterprise Intelligence</span>
        </div>
      )}
    </div>
  );
}

export default CompetitorIQLogo;
