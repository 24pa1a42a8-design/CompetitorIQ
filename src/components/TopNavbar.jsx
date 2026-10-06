import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Bell, LayoutGrid, Calendar, ChevronDown, Check,
  ExternalLink, RefreshCw, AlertCircle, User, Settings,
  Shield, HelpCircle, LogOut, Trash2, Building2, Tag, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

export default function TopNavbar({ 
  currentView, 
  setCurrentView, 
  breadcrumbs, 
  selectedCompetitor = 'Microsoft',
  dateFilter,
  onDateChange,
  onOpenNotificationDetail,
  onOpenAccountModal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null); // 'date' | 'views' | 'notifications' | 'profile' | null
  
  // Date filter state
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [notificationFilter, setNotificationFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Define the 11 official views
  const pages = [
    { id: 'dashboard', label: '1. CompetitorIQ Dashboard', desc: 'Main Executive Intelligence Overview' },
    { id: 'competitor_ecosystem', label: '2. Competitor Ecosystem', desc: 'Microsoft, Oracle, AWS, Google Cloud, Salesforce' },
    { id: 'competitor_profile', label: '3. Competitor Profile', desc: 'KPIs, Capability Matrix, Pricing' },
    { id: 'activity_timeline', label: '4. Activity Timeline', desc: 'Intelligence Stream, Weekly Signals' },
    { id: 'connect_dots', label: '5. Connect the Dots', desc: 'Strategic Pattern Visualizer, Chains' },
    { id: 'strategic_patterns', label: '6. Strategic Analysis', desc: 'Tactical Shifts, 6-Month Intensity' },
    { id: 'hindsight_memory', label: '7. Hindsight Memory', desc: 'Persistent Semantic Intelligence' },
    { id: 'ai_analyst', label: '8. AI Analyst', desc: 'Natural Language Query & Synthesis' },
    { id: 'alerts', label: '9. Alerts', desc: 'Signal Triage, AI Synthesis in Noise' },
    { id: 'competitive_comparison', label: '10. Competitive Comparison', desc: 'Cross-Competitor Market Matrix' },
    { id: 'executive_report', label: '11. Executive Report', desc: 'Brief, Market Trajectory, Risks' },
  ];

  // Date range presets calculation
  const datePresets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last 12 months', days: 365 },
    { label: 'Custom range', isCustom: true }
  ];

  // Fetch unread notification count on mount and polling
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiService.getUnreadAlertsCount();
      if (res && typeof res.count === 'number') {
        setUnreadCount(res.count);
      } else if (res && typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      // Non-blocking failure
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications list when notification dropdown opens
  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await apiService.getAlerts({ limit: 25 });
      const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setNotifications(items);
      const unread = items.filter(a => a.status === 'UNREAD').length;
      if (unreadCount === 0 && unread > 0) {
        setUnreadCount(unread);
      }
    } catch (err) {
      setNotificationsError(err.message || 'Unable to load notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const toggleDropdown = (name) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
      if (name === 'notifications') {
        fetchNotifications();
      }
    }
  };

  // Reusable outside-click and escape key behavior
  useEffect(() => {
    if (!activeDropdown) return;

    const handlePointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown]);

  // Date selection handlers
  const handleSelectPreset = (preset) => {
    if (preset.isCustom) {
      setShowCustomInputs(true);
      return;
    }
    setShowCustomInputs(false);
    const now = new Date();
    const startDate = new Date(now.getTime() - preset.days * 24 * 60 * 60 * 1000).toISOString();
    const endDate = now.toISOString();

    if (onDateChange) {
      onDateChange({
        label: preset.label,
        startDate,
        endDate
      });
    }
    setActiveDropdown(null);
  };

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (start > end) {
      alert('Start date must be before or equal to End date.');
      return;
    }
    // Set start to beginning of day, end to end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (onDateChange) {
      onDateChange({
        label: 'Custom range',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
    }
    setActiveDropdown(null);
  };

  // Notification handlers
  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllAlertsAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (item) => {
    // Optimistically mark as read
    if (item.status === 'UNREAD') {
      try {
        await apiService.updateAlertStatus(item.id, 'READ');
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, status: 'READ' } : n));
      } catch (e) {
        console.error('Failed to mark notification read', e);
      }
    }
    setActiveDropdown(null);
    if (onOpenNotificationDetail) {
      onOpenNotificationDetail(item);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setActiveDropdown(null);
    logout();
    navigate('/login');
  };

  const currentLabel = dateFilter?.label || 'Last 6 months';

  const filteredNotifications = notificationFilter === 'UNREAD' 
    ? notifications.filter(n => n.status === 'UNREAD')
    : notifications;

  return (
    <header 
      ref={navRef}
      className="h-16 bg-white border-b border-stone-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs font-sans select-none"
    >
      {/* Search Input Bar */}
      <div className="relative w-96 max-w-md hidden sm:block">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Oracle, IBM, AWS, Salesforce, pricing..."
          className="w-full bg-[#F8FAFC] border border-stone-200/90 rounded-full pl-10 pr-10 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition duration-150"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-stone-200 rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </div>

      {/* Nav Controls Group */}
      <div className="flex items-center gap-3 ml-auto">
        {/* 1. DATE RANGE DROPDOWN */}
        <div className="relative hidden md:block">
          <button 
            type="button"
            id="date-filter-button"
            aria-haspopup="true"
            aria-expanded={activeDropdown === 'date'}
            onClick={() => toggleDropdown('date')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              activeDropdown === 'date'
                ? 'border-orange-500 text-orange-700 bg-orange-50/50 ring-2 ring-orange-500/20'
                : 'border-stone-200/90 bg-white text-slate-700 hover:bg-stone-50'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${activeDropdown === 'date' ? 'text-orange-600' : 'text-slate-400'}`} />
            <span>{currentLabel}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeDropdown === 'date' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'date' && (
            <div 
              id="date-filter-popover"
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Filter Date Window</span>
                <span className="text-orange-600 font-mono text-[10px]">Real Telemetry</span>
              </div>

              <div className="py-1">
                {datePresets.map((preset) => {
                  const isSelected = preset.isCustom 
                    ? currentLabel === 'Custom range'
                    : currentLabel === preset.label;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                        isSelected 
                          ? 'bg-orange-50 font-bold text-orange-700' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Range Inputs */}
              {(showCustomInputs || currentLabel === 'Custom range') && (
                <form onSubmit={handleApplyCustomRange} className="p-3 border-t border-stone-100 bg-slate-50 space-y-2 mt-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Date Range</div>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Start Date</label>
                      <input 
                        type="date"
                        required
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">End Date</label>
                      <input 
                        type="date"
                        required
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded text-xs transition"
                  >
                    Apply Range
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* 2. VIEWS (11) DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            id="views-dropdown-button"
            aria-haspopup="true"
            aria-expanded={activeDropdown === 'views'}
            onClick={() => toggleDropdown('views')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              activeDropdown === 'views'
                ? 'border-orange-500 text-orange-700 bg-orange-50/50 ring-2 ring-orange-500/20'
                : 'border-stone-200/90 bg-white text-slate-700 hover:text-orange-600'
            }`}
            title="Jump to any view"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">Views (11)</span>
          </button>

          {activeDropdown === 'views' && (
            <div 
              id="views-dropdown-popover"
              className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>CompetitorIQ Views</span>
                <span className="text-orange-600 font-mono">11 Views</span>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {pages.map((p) => {
                  const isActive = currentView === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setCurrentView(p.id);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-orange-50/70 transition ${
                        isActive ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isActive ? 'text-orange-900 font-bold' : 'text-slate-900'}`}>{p.label}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-orange-600" />}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. NOTIFICATION BELL & POPOVER */}
        <div className="relative">
          <button 
            type="button"
            id="notification-bell-button"
            aria-haspopup="true"
            aria-expanded={activeDropdown === 'notifications'}
            onClick={() => toggleDropdown('notifications')}
            className={`relative p-2 rounded-full transition ${
              activeDropdown === 'notifications'
                ? 'bg-orange-100/70 text-orange-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/70'
            }`}
            title={unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'No unread notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {activeDropdown === 'notifications' && (
            <div 
              id="notifications-popover"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-stone-100 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">Intelligence Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="px-4 py-2 border-b border-stone-100 bg-white flex items-center gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setNotificationFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition ${notificationFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationFilter('UNREAD')}
                  className={`px-2.5 py-1 rounded-md transition ${notificationFilter === 'UNREAD' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Unread ({notifications.filter(n => n.status === 'UNREAD').length})
                </button>
              </div>

              {/* Notification List Container */}
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {notificationsLoading && (
                  <div className="p-8 text-center space-y-2">
                    <RefreshCw className="w-5 h-5 text-orange-600 animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">Loading intelligence...</p>
                  </div>
                )}

                {!notificationsLoading && notificationsError && (
                  <div className="p-6 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                    <p className="text-xs font-bold text-rose-800">Unable to load notifications</p>
                    <p className="text-[11px] text-slate-400">{notificationsError}</p>
                    <button
                      type="button"
                      onClick={fetchNotifications}
                      className="mt-1 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100 transition"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!notificationsLoading && !notificationsError && filteredNotifications.length === 0 && (
                  <div className="p-8 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">No new intelligence alerts</p>
                    <p className="text-[11px] text-slate-400">All competitive moves are reviewed.</p>
                  </div>
                )}

                {!notificationsLoading && !notificationsError && filteredNotifications.map((item) => {
                  const compName = item.competitor?.name || item.competitorName || 'Competitor';
                  const isUnread = item.status === 'UNREAD';
                  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className={`w-full text-left p-3.5 flex items-start gap-3 hover:bg-slate-50 transition ${
                        isUnread ? 'bg-orange-50/30' : 'bg-white'
                      }`}
                    >
                      {/* Status indicator dot */}
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isUnread ? 'bg-orange-600 ring-2 ring-orange-200' : 'bg-transparent'}`} />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                            {compName}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                            {item.type || 'SIGNAL'}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto">{dateStr}</span>
                        </div>

                        <div className={`text-xs text-slate-900 leading-snug line-clamp-1 ${isUnread ? 'font-bold' : 'font-medium'}`}>
                          {item.title}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-stone-100 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('alerts');
                    setActiveDropdown(null);
                  }}
                  className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  View All in Alerts Engine →
                </button>
                <span className="text-slate-400 font-mono text-[10px]">Real Database Events</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. PROFILE / "24" BUTTON & DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            id="profile-menu-button"
            aria-haspopup="menu"
            aria-expanded={activeDropdown === 'profile'}
            onClick={() => toggleDropdown('profile')}
            className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shadow-xs transition ${
              activeDropdown === 'profile'
                ? 'bg-orange-700 text-white ring-2 ring-orange-500 ring-offset-2'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
            title="User Account Menu"
          >
            {user?.initials || 'AR'}
          </button>

          {activeDropdown === 'profile' && (
            <div 
              id="profile-menu-popover"
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Profile Card Header */}
              <div className="p-4 border-b border-stone-100 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    {user?.initials || 'AR'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">{user?.name || 'Alex Rivera'}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user?.email || 'alex.rivera@enterprise.com'}</div>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-500">Org: Microsoft Team</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Enterprise</span>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(null);
                    if (onOpenAccountModal) onOpenAccountModal('settings');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(null);
                    if (onOpenAccountModal) onOpenAccountModal('settings');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(null);
                    if (onOpenAccountModal) onOpenAccountModal('notifications');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  <span>Notification Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(null);
                    if (onOpenAccountModal) onOpenAccountModal('security');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Security & Access</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(null);
                    if (onOpenAccountModal) onOpenAccountModal('help');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Help & Documentation</span>
                </button>

                <div className="my-1 border-t border-stone-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span>Log out</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(null);
                    if (onOpenAccountModal) onOpenAccountModal('delete_account');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
