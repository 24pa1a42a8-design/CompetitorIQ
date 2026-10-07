import React, { useState } from 'react';
import { Layers } from 'lucide-react';

const CATEGORIES = [
  { key: 'productEvents', label: 'Product & Feature' },
  { key: 'pricingEvents', label: 'Pricing & Billing' },
  { key: 'hiringEvents', label: 'Hiring Signals' },
  { key: 'expansionEvents', label: 'Expansion' },
  { key: 'partnershipEvents', label: 'Partnerships' },
  { key: 'messagingEvents', label: 'Messaging Shifts' }
];

const COLOR_PALETTE = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4'  // Cyan
];

export default function CategoryActivityChart({ competitors = [] }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!competitors || competitors.length === 0) {
    return null;
  }

  // Extract competitor names & color assignment
  const comps = competitors.map((c, i) => ({
    id: c.competitor?.id || i,
    name: c.competitor?.name || 'Competitor',
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
    metrics: c.metrics || {}
  }));

  // Compute maximum category count for scaling
  let globalMax = 1;
  CATEGORIES.forEach(cat => {
    comps.forEach(comp => {
      const val = comp.metrics[cat.key] || 0;
      if (val > globalMax) globalMax = val;
    });
  });

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest block">
            Dimensional Breakdown
          </span>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" /> Competitive Activity by Dimension
          </h3>
        </div>

        {/* Legend Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {comps.map(comp => (
            <div key={comp.id} className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: comp.color }} />
              <span>{comp.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped Bar Chart Area */}
      <div className="space-y-3 pt-1">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="space-y-1 bg-slate-50/60 p-2.5 rounded-xl border border-stone-200/60">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
              <span>{cat.label}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Total: {comps.reduce((sum, c) => sum + (c.metrics[cat.key] || 0), 0)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1 pt-0.5">
              {comps.map(comp => {
                const count = comp.metrics[cat.key] || 0;
                const percentage = Math.round((count / globalMax) * 100);
                const tooltipKey = `${cat.key}-${comp.id}`;
                const isHovered = activeTooltip === tooltipKey;

                return (
                  <div 
                    key={comp.id}
                    onMouseEnter={() => setActiveTooltip(tooltipKey)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className="flex items-center gap-2 text-[10px] font-medium"
                  >
                    <span className="w-20 truncate font-semibold text-slate-600 text-[10px] shrink-0">
                      {comp.name}
                    </span>

                    <div className="flex-1 h-3.5 bg-slate-200/70 rounded overflow-hidden relative flex items-center">
                      <div 
                        className="h-full rounded transition-all duration-300"
                        style={{ 
                          width: `${Math.max(percentage, count > 0 ? 5 : 0)}%`,
                          backgroundColor: comp.color,
                          opacity: isHovered ? 1 : 0.85
                        }}
                      />
                    </div>

                    <span className="w-6 text-right font-mono font-bold text-slate-900 shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
