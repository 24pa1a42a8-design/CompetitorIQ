import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Play, Pause, CheckCircle2, AlertTriangle, Layers, Clock } from 'lucide-react';
import apiService from '../../services/apiService';

export default function MonitoringStatusWidget() {
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningNow, setRunningNow] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getMonitoringStatus();
      setMonitoringData(res?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load monitoring status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunNow = async () => {
    setRunningNow(true);
    try {
      await apiService.runMonitoringAll(true);
      await fetchStatus();
    } catch (err) {
      setError('Failed to trigger manual monitoring run.');
    } finally {
      setRunningNow(false);
    }
  };

  const handleToggle = async () => {
    if (!monitoringData) return;
    try {
      const res = await apiService.toggleMonitoring(!monitoringData.enabled);
      setMonitoringData(res?.data?.status || monitoringData);
    } catch (err) {
      console.error(err);
    }
  };

  const metrics = monitoringData?.metrics || {};
  const sources = monitoringData?.sources || [];
  const isEnabled = monitoringData?.enabled;

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900">Continuous Competitor Source Monitoring</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {isEnabled ? 'ACTIVE' : 'PAUSED'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1"
          >
            {isEnabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isEnabled ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleRunNow}
            disabled={runningNow}
            className="px-3 py-1 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${runningNow ? 'animate-spin' : ''}`} />
            {runningNow ? 'Polling...' : 'Run All Now'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" /> Loading monitoring state...
        </div>
      )}

      {!loading && error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center">
          {error}
        </div>
      )}

      {!loading && !error && monitoringData && (
        <div className="space-y-3">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-stone-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">CONFIGURED SOURCES</span>
              <div className="text-base font-black text-slate-900">{monitoringData.sourcesConfigured} ({monitoringData.sourcesEnabled} Enabled)</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-stone-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">DISCOVERED EVENTS</span>
              <div className="text-base font-black text-emerald-600">{metrics.eventsDiscovered || 0}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-stone-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">DUPLICATES IGNORED</span>
              <div className="text-base font-black text-slate-700">{metrics.duplicatesIgnored || 0}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-stone-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">LAST CHECKED</span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {metrics.lastRunAt ? new Date(metrics.lastRunAt).toLocaleTimeString() : 'Pending'}
              </div>
            </div>
          </div>

          {/* Sources Status Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-stone-200">
                  <th className="p-2">Source ID</th>
                  <th className="p-2">Competitor</th>
                  <th className="p-2">Adapter</th>
                  <th className="p-2">Last Checked</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-slate-800">
                {sources.map(src => (
                  <tr key={src.sourceId} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-bold">{src.sourceId}</td>
                    <td className="p-2 font-semibold">{src.competitorName}</td>
                    <td className="p-2 text-slate-500 uppercase">{src.adapterType}</td>
                    <td className="p-2 text-slate-500">
                      {src.lastCheckedAt ? new Date(src.lastCheckedAt).toLocaleTimeString() : 'Never'}
                    </td>
                    <td className="p-2">
                      {src.failureCount === 0 ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Healthy
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Retry ({src.failureCount})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
