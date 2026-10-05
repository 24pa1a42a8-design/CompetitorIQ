import React, { useEffect } from 'react';
import { 
  X, ExternalLink, ShieldCheck, Clock, CheckCircle2, 
  Building2, Calendar, FileText, AlertTriangle
} from 'lucide-react';

export default function EvidenceModal({ isOpen, onClose, evidenceData }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !evidenceData) return null;

  const title = evidenceData.title || evidenceData.event?.title || 'Ground-Truth Verification Record';
  const competitor = evidenceData.competitor || evidenceData.entity || evidenceData.event?.competitor?.name || 'Monitored Competitor';
  const category = evidenceData.category || evidenceData.evidenceType || evidenceData.eventType || 'VERIFIED_SIGNAL';
  const excerpt = evidenceData.excerpt || evidenceData.summary || evidenceData.description || 'Verified signal captured from primary competitor source.';
  const capturedAt = evidenceData.capturedAt || evidenceData.timestamp || evidenceData.createdAt;
  const sourceUrl = evidenceData.sourceUrl || evidenceData.source?.url || evidenceData.url || null;
  const sourcePublisher = evidenceData.sourcePublisher || evidenceData.source?.publisher || evidenceData.source?.name || (sourceUrl ? 'Public Source' : 'Internal Database');
  const facts = Array.isArray(evidenceData.facts) ? evidenceData.facts : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-stone-100 bg-slate-50/70">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-orange-100/70 border border-orange-200 text-orange-700 rounded-xl mt-0.5">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 bg-white border border-stone-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                  {competitor}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  {category}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Primary Evidence
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                {title}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm text-slate-700 overflow-y-auto flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-stone-200/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Captured Date
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {capturedAt ? new Date(capturedAt).toLocaleString() : 'Recent'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-stone-200/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Publisher / Source
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {sourcePublisher}
              </span>
            </div>
          </div>

          {/* Primary Evidence Excerpt */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Verified Evidence Excerpt
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-stone-200 text-slate-800 text-xs sm:text-sm leading-relaxed font-mono">
              "{excerpt}"
            </div>
          </div>

          {/* Supporting Ground Truth Facts */}
          {facts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Supporting Ground Truth Facts
              </h3>
              <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-700">
                {facts.map((fact, idx) => (
                  <li key={idx}>{fact}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Badge */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-emerald-950">Ground Truth Authenticity</span>
              Signal verified against public company releases, pricing portals, or regulatory filings with content integrity hashing.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
              Verified record in internal database
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
