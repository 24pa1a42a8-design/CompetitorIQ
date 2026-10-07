import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

const COLOR_PALETTE = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4'  // Cyan
];

export default function CompetitiveTrendChart({ competitors = [], windowDays = 90 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!competitors || competitors.length === 0) {
    return null;
  }

  // 1. Generate chronological time buckets (e.g. 4 bi-weekly or 3 monthly intervals based on windowDays)
  const numBuckets = windowDays <= 30 ? 4 : (windowDays <= 90 ? 6 : 8);
  const now = Date.now();
  const bucketMs = (windowDays * 24 * 60 * 60 * 1000) / numBuckets;

  const buckets = Array.from({ length: numBuckets }).map((_, i) => {
    const startMs = now - (numBuckets - i) * bucketMs;
    const endMs = startMs + bucketMs;
    const dateObj = new Date(startMs);
    const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    return { index: i, startMs, endMs, label };
  });

  // 2. Map competitors and count events per bucket
  const compSeries = competitors.map((c, i) => {
    const name = c.competitor?.name || 'Competitor';
    const color = COLOR_PALETTE[i % COLOR_PALETTE.length];
    const events = c.supportingEvents || [];

    const bucketCounts = buckets.map(b => {
      return events.filter(e => {
        const t = new Date(e.eventDate).getTime();
        return t >= b.startMs && t < b.endMs;
      }).length;
    });

    return { id: c.competitor?.id || i, name, color, counts: bucketCounts };
  });

  // Calculate maximum event count across buckets for Y-axis scale
  let maxBucketVal = 1;
  compSeries.forEach(s => {
    s.counts.forEach(cnt => {
      if (cnt > maxBucketVal) maxBucketVal = cnt;
    });
  });

  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  // Helper to map index & count to X, Y SVG coordinates
  const getX = (idx) => paddingX + (idx / Math.max(1, numBuckets - 1)) * innerW;
  const getY = (val) => chartHeight - paddingY - (val / maxBucketVal) * innerH;

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest block">
            Temporal Trajectory
          </span>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" /> Competitive Activity Trend ({windowDays}d)
          </h3>
        </div>

        {/* Legend Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {compSeries.map(s => (
            <div key={s.id} className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive SVG Line Chart */}
      <div className="relative pt-2">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-auto overflow-visible"
        >
          {/* Horizontal Grid Lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = chartHeight - paddingY - ratio * innerH;
            const valLabel = Math.round(ratio * maxBucketVal);
            return (
              <g key={idx}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={chartWidth - paddingX} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeDasharray="3 3" 
                  strokeWidth="1"
                />
                <text 
                  x={paddingX - 8} 
                  y={y + 3} 
                  fill="#94a3b8" 
                  fontSize="9" 
                  textAnchor="end" 
                  fontFamily="monospace"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {buckets.map((b, idx) => (
            <text 
              key={idx} 
              x={getX(idx)} 
              y={chartHeight - 6} 
              fill="#64748b" 
              fontSize="9" 
              textAnchor="middle"
              className="font-mono"
            >
              {b.label}
            </text>
          ))}

          {/* Lines and Data Points */}
          {compSeries.map(s => {
            const points = s.counts.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');

            return (
              <g key={s.id}>
                {/* SVG Polyline */}
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />

                {/* Data Point Circles */}
                {s.counts.map((val, idx) => {
                  const cx = getX(idx);
                  const cy = getY(val);
                  const pointKey = `${s.id}-${idx}`;
                  const isHovered = hoveredPoint?.key === pointKey;

                  return (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5 : 3.5}
                      fill={s.color}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredPoint({ key: pointKey, name: s.name, val, date: buckets[idx].label, x: cx, y: cy })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div 
            className="absolute bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md border border-slate-700 -translate-x-1/2 pointer-events-none z-20 animate-in fade-in duration-100"
            style={{
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${Math.max(0, (hoveredPoint.y / chartHeight) * 100 - 35)}%`
            }}
          >
            <div>{hoveredPoint.name}: <span className="text-orange-400 font-mono">{hoveredPoint.val} events</span></div>
            <div className="text-[9px] text-slate-400 font-normal">Period starting {hoveredPoint.date}</div>
          </div>
        )}
      </div>
    </div>
  );
}
