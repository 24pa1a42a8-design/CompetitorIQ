import React from 'react';
import { 
  X, ExternalLink, ShieldCheck, Clock, FileText, CheckCircle2, AlertTriangle, ArrowRight 
} from 'lucide-react';

export default function EvidenceModal({ isOpen, onClose, evidenceData }) {
  if (!isOpen || !evidenceData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Ground-Truth Evidence</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 98.4% Confidence
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{evidenceData.title || 'Signal Verification Log'}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm text-slate-700 max-h-[75vh] overflow-y-auto">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Context Summary</h4>
            <p className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-slate-800 leading-relaxed text-sm">
              {evidenceData.description || 'Raw telemetry ingestion confirmed patent filing and engineering role reallocation matching competitor offensive playbook.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Source Entity</span>
              <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                {evidenceData.entity || 'Oracle System Core'}
              </span>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Timestamp Logged</span>
              <span className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {evidenceData.timestamp || 'Today, 09:45 AM EDT'}
              </span>
            </div>
          </div>

          {/* Raw Signal Traces */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ingestion Trace & Corroborating Signals</h4>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="text-slate-500 select-none">[telemetry]</span>
                <span>SHA-256 Verified hash: 4f8b91a27e01bcf5a88c39d8... Ingested via API Connector v2.4</span>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 flex items-start gap-2">
                <span className="text-slate-400 select-none">[crawler]</span>
                <span>URL diff detected on /pricing & /enterprise documentation: 14 changes confirmed</span>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 flex items-start gap-2">
                <span className="text-slate-400 select-none">[patent]</span>
                <span>USPTO App #2024-0192849: 'Multi-Tenant Neural Retrieval Layer'</span>
              </div>
            </div>
          </div>

          {/* Action Recommendation */}
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block text-amber-950 mb-0.5">Analyst Recommendation</span>
              Incorporate this finding into next Monday's product steering committee. Escalation to Executive Brief recommended.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs">
          <button 
            onClick={onClose}
            className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-200 transition"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> View Raw Dump
            </button>
            <button 
              onClick={() => {
                alert('Signal pinned to Executive Strategy Brief!');
                onClose();
              }}
              className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              Pin to Executive Brief <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

