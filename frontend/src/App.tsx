import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import SessionsView from './components/SessionsView';
import HeatmapView from './components/HeatmapView';
import { getSessions, getSessionEvents } from './lib/api';

export default function App() {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalEvents: 0,
    pageViews: 0,
    clicks: 0,
    backendOnline: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Poll stats every 10 seconds for real-time reporting
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const sessions = await getSessions();
      let clickCount = 0;
      let pageViewCount = 0;
      let eventCount = 0;

      // Compile stats by requesting event details for each session
      if (sessions.length > 0) {
        const allEventsPromises = sessions.map(s => getSessionEvents(s.session_id));
        
        const allSessionsEvents = await Promise.all(allEventsPromises);
        allSessionsEvents.forEach(eventsList => {
          eventCount += eventsList.length;
          eventsList.forEach((e: any) => {
            if (e.event_type === 'click') clickCount++;
            if (e.event_type === 'page_view') pageViewCount++;
          });
        });
      }

      setStats({
        totalSessions: sessions.length,
        totalEvents: eventCount,
        clicks: clickCount,
        pageViews: pageViewCount,
        backendOnline: true
      });
    } catch (error) {
      console.warn('Backend API appears offline:', error);
      setStats(prev => ({ ...prev, backendOnline: false }));
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if a route is active
  const isTabActive = (path: string) => {
    if (path === '/sessions') {
      return location.pathname === '/sessions' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-[#060814] text-[#f3f4f6] flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#060814]/85 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
            CF
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              CausalFunnel Analytics
              <span className="text-[10px] font-semibold tracking-widest px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                DASHBOARD
              </span>
            </h1>
            <p className="text-xs text-[#9ca3af]">User Behavior & Session Heatmap Replays</p>
          </div>
        </div>

        {/* System Health Status */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border ${
            stats.backendOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${stats.backendOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            {stats.backendOnline ? 'API Server: Online' : 'API Server: Offline'}
          </div>

          <button 
            onClick={fetchStats}
            className="p-2 bg-white/5 border border-white/5 text-[#9ca3af] hover:text-white rounded-lg transition-all"
            title="Force refresh statistics"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 space-y-6">
        
        {/* Connection Offline Alert Banner */}
        {!stats.backendOnline && !loading && (
          <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-wrap gap-4 items-center justify-between animate-fade-in">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Express Backend Offline</h4>
              <p className="text-xs text-[#fca5a5]">
                The Vite dashboard is unable to reach the API server on <code>http://localhost:5000</code>. Please make sure MongoDB is active and start the backend using <code>npm run dev</code> inside `/backend`.
              </p>
            </div>
            <div className="bg-rose-500/20 border border-rose-500/20 rounded-xl px-4 py-2 font-mono text-[10px] text-rose-300">
              cd backend ; npm run dev
            </div>
          </div>
        )}

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Card 1: Unique Sessions */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 text-2xl opacity-20">👥</div>
            <span className="text-xs text-[#9ca3af]">Total Sessions</span>
            <p className="text-3xl font-extrabold text-white font-mono">{stats.totalSessions}</p>
            <div className="text-[10px] text-emerald-400 font-semibold">↑ Live tracking</div>
          </div>

          {/* Card 2: Combined Event Count */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 text-2xl opacity-20">📊</div>
            <span className="text-xs text-[#9ca3af]">Total Tracked Events</span>
            <p className="text-3xl font-extrabold text-white font-mono">{stats.totalEvents}</p>
            <div className="text-[10px] text-[#9ca3af]">Views & clicks stream</div>
          </div>

          {/* Card 3: Page Views */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 text-2xl opacity-20">📄</div>
            <span className="text-xs text-[#9ca3af]">Page Views</span>
            <p className="text-3xl font-extrabold text-white font-mono">{stats.pageViews}</p>
            <div className="text-[10px] text-indigo-400 font-semibold">
              {stats.totalEvents > 0 ? ((stats.pageViews / stats.totalEvents) * 100).toFixed(0) : 0}% of total events
            </div>
          </div>

          {/* Card 4: Coordinates Clicks */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 text-2xl opacity-20">📍</div>
            <span className="text-xs text-[#9ca3af]">Interactive Clicks</span>
            <p className="text-3xl font-extrabold text-white font-mono">{stats.clicks}</p>
            <div className="text-[10px] text-rose-400 font-semibold">
              {stats.totalEvents > 0 ? ((stats.clicks / stats.totalEvents) * 100).toFixed(0) : 0}% click density ratio
            </div>
          </div>
        </div>

        {/* React Router Links Tab Bar */}
        <div className="flex border-b border-white/5 gap-6">
          <Link
            to="/sessions"
            className={`pb-3 font-semibold text-sm transition-all relative ${
              isTabActive('/sessions') 
                ? 'text-white border-b-2 border-indigo-500' 
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Sessions Journey Feed
          </Link>
          <Link
            to="/heatmap"
            className={`pb-3 font-semibold text-sm transition-all relative ${
              isTabActive('/heatmap') 
                ? 'text-white border-b-2 border-indigo-500' 
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Page Click Heatmaps
          </Link>
        </div>

        {/* Router View Switching */}
        <div className="animate-fade-in">
          <Routes>
            <Route path="/" element={<SessionsView />} />
            <Route path="/sessions" element={<SessionsView />} />
            <Route path="/heatmap" element={<HeatmapView />} />
          </Routes>
        </div>

        {/* How to Embed Script Info Drawer */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-3">
          <h4 className="text-sm font-semibold text-white">How to embed this tracker on any page:</h4>
          <p className="text-xs text-[#9ca3af] leading-relaxed">
            To track interactions, load the lightweight tracking script on your HTML pages. Insert this script tag just before your closing <code>&lt;/body&gt;</code> tag:
          </p>
          <pre className="bg-[#0c0e1b] p-4 rounded-xl border border-white/5 overflow-x-auto text-[11px] font-mono text-indigo-300">
{`<!-- CausalFunnel Event Tracker script -->
<script 
  src="https://causalfunnel-lm4v.onrender.com/tracker/tracker.js" 
  data-api-url="https://causalfunnel-lm4v.onrender.com"
></script>`}
          </pre>
          <p className="text-[11px] text-[#9ca3af]">
            💡 <b>Note:</b> You can open <code>https://causalfunnel-lm4v.onrender.com/tracker/demo.html</code> directly in your browser to generate mock session events and observe live coordinates updates on this dashboard.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-[#9ca3af] mt-12">
        <p>© 2026 Md Faizan. Built with React, Node.js & MongoDB.</p>
      </footer>
    </div>
  );
}
