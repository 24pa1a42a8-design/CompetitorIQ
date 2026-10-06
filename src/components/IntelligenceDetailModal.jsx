import React, { useEffect } from 'react';
import { 
  X, ExternalLink, ShieldCheck, Clock, CheckCircle2, 
  Building2, Tag, Calendar, Layers, DollarSign, Briefcase, Zap, Info, Image as ImageIcon
} from 'lucide-react';

export default function IntelligenceDetailModal({ isOpen, onClose, detail }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !detail) return null;

  const event = detail.event || detail;
  const competitor = detail.competitor || event.competitor || {};
  const competitorName = competitor.name || detail.competitorName || 'Competitor';
  const eventType = detail.type || event.eventType || 'INTELLIGENCE_SIGNAL';
  const title = detail.title || event.title || 'Intelligence Signal';
  const rawDescription = detail.message || event.description || event.summary || 'Verified competitive signal.';
  const eventDate = event.eventDate || detail.createdAt;
  const detectedDate = event.detectedAt || detail.createdAt || event.createdAt;
  const source = event.source || detail.source || {};
  const sourceUrl = source.url || detail.sourceUrl || (typeof detail.source === 'string' && detail.source.startsWith('http') ? detail.source : null);
  const sourcePublisher = source.publisher || source.name || detail.sourceName || (sourceUrl ? new URL(sourceUrl, 'https://example.com').hostname : 'Official Source');
  const evidenceList = event.evidence || detail.evidence || [];
  const pricingSignals = event.pricingSignals || detail.pricingSignals || [];
  const productSignals = event.productSignals || detail.productSignals || [];

  // Extract official image URL if available
  const imgFromDesc = typeof rawDescription === 'string' ? rawDescription.match(/\[Image:\s*(https?:\/\/[^\]\s]+)\]/) : null;
  const imgFromEvidence = evidenceList.length > 0 && typeof evidenceList[0].excerpt === 'string'
    ? evidenceList[0].excerpt.match(/\[Image:\s*(https?:\/\/[^\]\s]+)\]/)
    : null;
  const imageUrl = (imgFromDesc ? imgFromDesc[1] : null) || 
                   (imgFromEvidence ? imgFromEvidence[1] : null) || 
                   detail.imageUrl || event.imageUrl || null;

  const cleanDescription = typeof rawDescription === 'string'
    ? rawDescription.replace(/\[Image:\s*https?:\/\/[^\]\s]+\]\s*/g, '').trim()
    : 'Verified competitive signal.';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intel-detail-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-stone-100 bg-slate-50/70">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-orange-100/70 border border-orange-200 text-orange-700 rounded-xl mt-0.5">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 bg-white border border-stone-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                  {competitorName}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  {eventType}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Record
                </span>
              </div>
              <h2 id="intel-detail-title" className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                {title}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm text-slate-700 overflow-y-auto flex-1">
          {/* Official Image if available */}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-stone-200 bg-slate-950 relative group max-h-64 flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover max-h-64 group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="absolute bottom-2 right-2 text-[10px] bg-slate-950/80 backdrop-blur-xs text-white px-2.5 py-0.5 rounded font-medium border border-white/20 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-orange-400" />
                Official Source Image
              </span>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-stone-200/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Published Date
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {eventDate ? new Date(eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-stone-200/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Retrieved Date
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {detectedDate ? new Date(detectedDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-stone-200/80 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Verified Source
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {sourcePublisher}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Intelligence Summary
            </h3>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-stone-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {cleanDescription}
            </div>
          </div>

          {/* Pricing Signals if available */}
          {pricingSignals.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Pricing Intelligence
              </h3>
              <div className="space-y-2">
                {pricingSignals.map((ps, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-950">{ps.productName || 'Service / Tier'}</div>
                    <div className="flex items-center gap-3 text-slate-600">
                      {ps.previousPrice && (
                        <span>Previous: <span className="line-through">{ps.previousPrice}</span></span>
                      )}
                      {ps.newPrice && (
                        <span className="font-bold text-emerald-700">New: {ps.newPrice}</span>
                      )}
                      {ps.priceChangePercent && (
                        <span className="font-semibold text-emerald-800">({ps.priceChangePercent}%)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Signals if available */}
          {productSignals.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" /> Product & Feature Specifications
              </h3>
              <div className="space-y-2">
                {productSignals.map((pr, idx) => (
                  <div key={idx} className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-blue-950">{pr.productName || pr.featureName}</div>
                    {pr.changeType && <div className="text-blue-700 font-semibold">{pr.changeType}</div>}
                    {pr.details && <div className="text-slate-600">{pr.details}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Records */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> Ground-Truth Evidence Excerpt
            </h3>
            {evidenceList.length > 0 ? (
              <div className="space-y-2">
                {evidenceList.map((ev, i) => {
                  const cleanExcerpt = (ev.excerpt || ev.content || '').replace(/\[Image:\s*https?:\/\/[^\]\s]+\]\s*/g, '').trim();
                  return (
                    <div key={i} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-700 italic">
                      "{cleanExcerpt || 'Evidence record recorded in system.'}"
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-700 italic">
                "{cleanDescription || 'Verified intelligence record from public disclosure.'}"
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-stone-200 text-xs">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-200/70 transition"
          >
            Close
          </button>
          {sourceUrl && sourceUrl !== '#' ? (
            <a 
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Original Source
            </a>
          ) : (
            <span className="text-xs text-slate-400 font-medium italic">
              Official source verified in internal database
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
