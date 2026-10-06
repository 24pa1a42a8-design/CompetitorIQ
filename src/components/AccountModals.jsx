import React, { useEffect, useState } from 'react';
import { 
  X, User, Settings, Bell, Shield, HelpCircle, 
  AlertTriangle, Check, Info, Lock, ExternalLink
} from 'lucide-react';

export default function AccountModals({ activeModal, onClose, user }) {
  useEffect(() => {
    if (!activeModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, onClose]);

  const [notificationPrefs, setNotificationPrefs] = useState({
    priceChanges: true,
    productLaunches: true,
    hiringSpikes: true,
    partnerships: true,
    criticalAlertsOnly: false,
    emailDigest: true
  });

  if (!activeModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal: Account Settings */}
        {activeModal === 'settings' && (
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">Account Settings</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  readOnly 
                  value={user?.name || 'Alex Rivera'} 
                  className="w-full bg-slate-50 border border-stone-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-medium cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Email Address</label>
                <input 
                  type="text" 
                  readOnly 
                  value={user?.email || 'alex.rivera@enterprise.com'} 
                  className="w-full bg-slate-50 border border-stone-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-medium cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Organization & Workspace</label>
                <input 
                  type="text" 
                  readOnly 
                  value="CompetitorIQ Enterprise (Microsoft Landscape)" 
                  className="w-full bg-slate-50 border border-stone-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-medium cursor-not-allowed"
                />
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2.5 text-xs text-orange-950">
                <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>Account attributes are managed via your SSO Identity Provider. Contact your administrator to update role mappings.</span>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-stone-100 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Modal: Notification Settings */}
        {activeModal === 'notifications' && (
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">Notification Preferences</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs sm:text-sm text-slate-700">
              <p className="text-xs text-slate-500 mb-2">Configure real-time alerts and intelligence dispatch channels.</p>
              
              {[
                { key: 'priceChanges', label: 'Pricing Changes & Tier Adjustments', desc: 'Real-time alert when competitors modify pricing' },
                { key: 'productLaunches', label: 'Product Launches & Major Features', desc: 'Instant alerts on new competitive releases' },
                { key: 'partnerships', label: 'Strategic Partnerships & Alliances', desc: 'Notifies when joint ventures are detected' },
                { key: 'hiringSpikes', label: 'Hiring Activity & Key Leadership', desc: 'Aggregated hiring velocity changes' },
                { key: 'emailDigest', label: 'Daily Intelligence Briefing Email', desc: 'Summary of the top competitive moves' }
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-stone-200 cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    checked={notificationPrefs[key]} 
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [key]: e.target.checked })}
                    className="mt-1 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{label}</div>
                    <div className="text-[11px] text-slate-500">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-stone-100 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 transition">
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Modal: Security */}
        {activeModal === 'security' && (
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">Account Security & Access</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-3 bg-slate-50 border border-stone-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Two-Factor Authentication (2FA)</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Enforced</span>
                </div>
                <p className="text-xs text-slate-500">Secured via Enterprise OAuth 2.0 / SAML protocol.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-stone-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Session Security</span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">TLS 1.3 Active</span>
                </div>
                <p className="text-xs text-slate-500">Tokens are cryptographically signed with short expiration windows.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-stone-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Database Multi-Tenancy</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Isolated Org</span>
                </div>
                <p className="text-xs text-slate-500">PostgreSQL organization isolation header enforces zero cross-tenant leakage.</p>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-stone-100 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Modal: Help & Support */}
        {activeModal === 'help' && (
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">Help & Support Documentation</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs sm:text-sm text-slate-700">
              <p className="text-xs text-slate-500">Quick guides and resources for CompetitorIQ competitive intelligence:</p>
              
              <div className="p-3 bg-slate-50 border border-stone-200 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">How Data is Ingested & Verified</h4>
                <p className="text-xs text-slate-500">CompetitorIQ monitors official public sources for Microsoft, Oracle, AWS, Google Cloud, and Salesforce. Raw signals are validated and stored in PostgreSQL.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-stone-200 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Hindsight Semantic Memory</h4>
                <p className="text-xs text-slate-500">Retains historical intelligence in memory banks, enabling cross-time comparison and trajectory analysis with zero hallucination.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-stone-200 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">AI Agent Workspace</h4>
                <p className="text-xs text-slate-500">Ask questions about competitor pricing moves, product releases, or strategic intentions directly to the grounded agent engine.</p>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-stone-100 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Modal: Delete Account Confirmation */}
        {activeModal === 'delete_account' && (
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/80">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-rose-900 text-base">Delete your account?</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <p className="font-medium text-slate-800">
                You are requesting the permanent deletion of your CompetitorIQ account and session credentials.
              </p>
              
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Destructive Action Notice
                </div>
                <p>
                  This action is permanent and cannot be undone. All saved workspaces, custom views, and notification channels linked to this identity would be detached.
                </p>
              </div>

              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
                <span className="font-bold block text-slate-900 mb-1">Notice: Enterprise Policy Restriction</span>
                Account self-deletion is currently disabled in this environment by organization policy. To de-provision your account, please submit an administrative ticket to your enterprise workspace administrator.
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-stone-100 flex justify-end gap-2">
              <button 
                onClick={onClose} 
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button 
                disabled 
                title="Account deletion disabled by organizational policy"
                className="px-4 py-2 bg-rose-300 text-white rounded-lg text-xs font-semibold cursor-not-allowed opacity-70"
              >
                Deletion Unavailable
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
