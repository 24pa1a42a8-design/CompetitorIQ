import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, Clock, CheckCircle2, 
  Sparkles, AlertTriangle, Check, RefreshCw, Eye
} from 'lucide-react';
import apiService from '../services/apiService';

export default function AlertsView({ onNavigate, onOpenEvidence }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const reqIdRef = React.useRef(0);

  const fetchAlerts = async () => {
    const currentReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getAlerts({ limit: 50 });
      if (currentReqId !== reqIdRef.current) return;
      let loadedAlerts = res?.data || [];
      
      // Fallback: If no alerts exist yet, evaluate alerts for existing events
      if (loadedAlerts.length === 0) {
        try {
          await apiService.evaluateAlerts({});
          const retryRes = await apiService.getAlerts({ limit: 50 });
          if (currentReqId !== reqIdRef.current) return;
          loadedAlerts = retryRes?.data || [];
        } catch {
          // Ignore eval error on fallback
        }
      }

      if (currentReqId !== reqIdRef.current) return;
      setAlerts(loadedAlerts);
    } catch (err) {
      if (currentReqId !== reqIdRef.current) return;
      if (err.name === 'AbortError' || err.isCancelled) return;
      console.error('Failed to load competitive alerts:', err);
      setError(err.message || 'Failed to load intelligence alerts');
    } finally {
      if (currentReqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleEvaluateAlerts = async () => {
    setEvaluating(true);
    setError(null);
    try {
      await apiService.evaluateAlerts({});
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to evaluate alerts:', err);
      setError(err.message || 'Failed to evaluate threat alerts.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllAlertsAsRead();
      setAlerts(prev => prev.map(a => ({ ...a, status: 'READ' })));
      if (selectedAlert) {
        setSelectedAlert(prev => prev ? { ...prev, status: 'READ' } : null);
      }
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (alertId, newStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiService.updateAlertStatus(alertId, newStatus);
      if (res?.data) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
        if (selectedAlert?.id === alertId) {
          setSelectedAlert(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error('Failed to update alert status:', err);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      (alert.title && alert.title.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (alert.message && alert.message.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (alert.competitor?.name && alert.competitor.name.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (alert.type && alert.type.toLowerCase().includes(filterQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNREAD') return alert.status === 'UNREAD';
    if (activeTab === 'CRITICAL') return alert.severity === 'CRITICAL';
    if (activeTab === 'HIGH') return alert.severity === 'HIGH';
    if (activeTab === 'PRICING') return alert.type === 'PRICE_CHANGE';
    if (activeTab === 'PRODUCT') return alert.type === 'NEW_PRODUCT' || alert.type === 'NEW_FEATURE';
    if (activeTab === 'HIRING') return alert.type === 'HIRING_SPIKE';
    return true;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="text-[10px] font-black tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] font-extrabold tracking-wider text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-orange-600" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-bold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACKNOWLEDGED':
        return <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">ACKNOWLEDGED</span>;
      case 'RESOLVED':
        return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> RESOLVED</span>;
      case 'READ':
        return <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">READ</span>;
      default:
        return <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 border border-orange-300 px-2 py-0.5 rounded animate-pulse">NEW</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150 font-sans text-slate-800">


      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Rule-Based Strategic Alert Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Competitive Alerts & Strategic Signals
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Real-time threat alerts evaluated from verified PostgreSQL events & primary evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleEvaluateAlerts}
            disabled={evaluating || loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            {evaluating ? 'Evaluating...' : 'Evaluate Signals'}
          </button>
          <button
            onClick={handleMarkAllRead}
            disabled={loading || alerts.length === 0}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          >
            Mark All Read
          </button>
          <button 
            onClick={() => onNavigate('ai_analyst')}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Threat Assessment
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'UNREAD', label: 'Unread' },
            { id: 'CRITICAL', label: 'Critical' },
            { id: 'HIGH', label: 'High' },
            { id: 'PRICING', label: 'Pricing' },
            { id: 'PRODUCT', label: 'Product' },
            { id: 'HIRING', label: 'Hiring' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAlerts} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Evaluating Competitive Threat Signals...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAlerts.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-4">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Competitive Alerts Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {filterQuery || activeTab !== 'ALL' 
                ? 'No alerts match the selected filter criteria. Try clearing filters.'
                : 'Ingest public competitor signals or trigger the evaluation engine over existing database events.'}
            </p>
          </div>
          <button
            onClick={handleEvaluateAlerts}
            disabled={evaluating}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            <ShieldAlert className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
            {evaluating ? 'Evaluating Signals...' : 'Evaluate Signals Now'}
          </button>
        </div>
      )}

      {/* Alerts Feed List */}
      {!loading && filteredAlerts.length > 0 && (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              onClick={() => setSelectedAlert(alert)}
              className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-orange-300 transition cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {alert.competitor?.name || alert.event?.competitor?.name || 'Competitor'}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded uppercase">
                    {alert.type}
                  </span>
                  {getStatusBadge(alert.status)}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition flex items-center gap-1.5">
                  {alert.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mt-1 whitespace-pre-line">
                  {alert.message}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  {alert.event?.evidence?.[0] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenEvidence) {
                          onOpenEvidence({
                            title: alert.title,
                            competitor: alert.competitor?.name || 'Competitor',
                            evidenceType: alert.event.evidence[0].evidenceType,
                            excerpt: alert.event.evidence[0].excerpt,
                            capturedAt: alert.event.evidence[0].capturedAt,
                            sourceUrl: alert.event?.source?.url || 'Public Source'
                          });
                        }
                      }}
                      className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline"
                    >
                      <Eye className="w-3 h-3" /> View Evidence
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === 'UNREAD' && (
                    <button
                      onClick={(e) => handleUpdateStatus(alert.id, 'READ', e)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      Mark Read
                    </button>
                  )}
                  {alert.status !== 'ACKNOWLEDGED' && alert.status !== 'RESOLVED' && (
                    <button
                      onClick={(e) => handleUpdateStatus(alert.id, 'ACKNOWLEDGED', e)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={(e) => handleUpdateStatus(alert.id, 'RESOLVED', e)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                {getSeverityBadge(selectedAlert.severity)}
                <span className="text-xs font-bold text-slate-800">{selectedAlert.competitor?.name || 'Competitor'}</span>
              </div>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">{selectedAlert.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Detected: {new Date(selectedAlert.createdAt).toLocaleString()}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-stone-200 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Strategic Reasoning</h5>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedAlert.message}
              </p>
            </div>

            {selectedAlert.event && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Event Metadata</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-slate-400 font-medium">Confidence Score:</span>
                    <p className="font-bold text-slate-800">{Math.round((selectedAlert.event.confidence || 0.9) * 100)}% Verified</p>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-slate-400 font-medium">Importance Level:</span>
                    <p className="font-bold text-slate-800">{selectedAlert.event.importance || 'MEDIUM'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2">
                {selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={(e) => handleUpdateStatus(selectedAlert.id, 'RESOLVED', e)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
                {selectedAlert.status !== 'ACKNOWLEDGED' && selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={(e) => handleUpdateStatus(selectedAlert.id, 'ACKNOWLEDGED', e)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Acknowledge
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
