import React, { useState } from 'react';
import { BarChart2, CheckCircle2 } from 'lucide-react';

const COLOR_PALETTE = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4'  // Cyan
];

export default function CompetitiveActivityChart({ competitors = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!competitors || competitors.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs text-center space-y-2 text-slate-500 text-xs">
        <BarChart2 className="w-5 h-5 text-slate-400 mx-auto" />
        <p>No competitor activity data available for selected criteria.</p>
      </div>
    );
  }

  const items = competitors.map((c, i) => ({
    name: c.competitor?.name || 'Competitor',
    count: c.metrics?.totalEvents || 0,
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
    hasData: c.hasSufficientEvidence
  }));

  const maxCount = Math.max(...items.map(it => it.count), 1);

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest block">
            Factual Volume Breakdown
          </span>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-orange-600" /> Competitive Activity Overview
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Total Events: {items.reduce((sum, it) => sum + it.count, 0)}
        </span>
      </div>

      {/* Horizontal Bar Chart Bars */}
      <div className="space-y-3 pt-1">
        {items.map((item, idx) => {
          const percentage = Math.round((item.count / maxCount) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div 
              key={item.name + idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="space-y-1 group transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: item.color }} 
                  />
                  {item.name}
                </span>
                <span className="text-slate-900 font-mono">
                  {item.count} <span className="text-[10px] text-slate-400 font-normal">verified events</span>
                </span>
              </div>

              {/* Bar Outer Track */}
              <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden border border-stone-200/60 flex items-center">
                {/* Bar Fill */}
                <div 
                  className="h-full rounded-lg transition-all duration-300 ease-out flex items-center justify-end pr-2"
                  style={{ 
                    width: `${Math.max(percentage, 4)}%`,
                    backgroundColor: item.color,
                    opacity: hoveredIdx === null || isHovered ? 1 : 0.6
                  }}
                >
                  {percentage > 15 && (
                    <span className="text-[10px] font-extrabold text-white drop-shadow-xs font-mono">
                      {item.count}
                    </span>
                  )}
                </div>

                {percentage <= 15 && (
                  <span className="text-[10px] font-bold text-slate-600 pl-2 font-mono">
                    {item.count}
                  </span>
                )}
              </div>

              {/* Tooltip Overlay Info */}
              {isHovered && (
                <div className="text-[10px] text-slate-500 font-medium pt-0.5 flex items-center gap-1 animate-in fade-in duration-100">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{item.name} represents {Math.round((item.count / Math.max(1, items.reduce((s, x) => s + x.count, 0))) * 100)}% of total observed competitive moves in window.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
