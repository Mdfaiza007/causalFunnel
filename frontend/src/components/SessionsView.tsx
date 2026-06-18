import { useState, useEffect } from 'react';
import { getSessions, getSessionEvents } from '../lib/api';
import type { Session, TrackedEvent } from '../lib/api';

export default function SessionsView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [events, setEvents] = useState<TrackedEvent[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Load all sessions
  useEffect(() => {
    loadSessions();
  }, []);

  // Load events when session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadEvents(selectedSessionId);
    } else {
      setEvents([]);
    }
  }, [selectedSessionId]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    const data = await getSessions();
    setSessions(data);
    if (data.length > 0 && !selectedSessionId) {
      setSelectedSessionId(data[0].session_id); // Auto-select first session
    }
    setLoadingSessions(false);
  };

  const loadEvents = async (id: string) => {
    setLoadingEvents(true);
    const data = await getSessionEvents(id);
    setEvents(data);
    setLoadingEvents(false);
  };

  // Helper: Format duration (diff between started_at and last_active)
  const formatDuration = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 1000) return '< 1s';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs}s`;
  };

  // Helper: Format date
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Helper: Format relative timestamp from start of session
  const getRelativeTime = (eventTime: string, startTime: string) => {
    const diffMs = new Date(eventTime).getTime() - new Date(startTime).getTime();
    const diffSec = diffMs / 1000;
    if (diffSec < 0.1) return '+0.0s';
    if (diffSec < 60) return `+${diffSec.toFixed(1)}s`;
    const mins = Math.floor(diffSec / 60);
    const secs = (diffSec % 60).toFixed(0);
    return `+${mins}m ${secs}s`;
  };

  // Helper: Extract page name from URL
  const getPageName = (url: string) => {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      return pathname === '/' || pathname === '' ? 'demo.html' : pathname.split('/').pop() || pathname;
    } catch {
      return url.split('/').pop() || url;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* Left Column: Sessions List */}
      <div className="lg:col-span-4 flex flex-col glass-panel rounded-2xl overflow-hidden border border-white/5 h-full">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
            <p className="text-xs text-[#9ca3af]">Total recorded visitors</p>
          </div>
          <button 
            onClick={loadSessions}
            className="p-2 rounded-lg bg-white/5 text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
            title="Reload Sessions"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingSessions ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[#9ca3af]">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <span className="text-3xl mb-2">👥</span>
              <p className="text-sm font-semibold text-white">No sessions yet</p>
              <p className="text-xs text-[#9ca3af] mt-1">Open tracker/demo.html to record events!</p>
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = s.session_id === selectedSessionId;
              const duration = formatDuration(s.started_at, s.last_active);
              
              return (
                <div
                  key={s.session_id}
                  onClick={() => setSelectedSessionId(s.session_id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                      : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="font-mono text-xs text-white/90 truncate max-w-[70%]">
                      {s.session_id.substring(0, 18)}...
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      s.total_events > 5 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {s.total_events} events
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-[#9ca3af]">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(s.started_at)}
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-indigo-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {duration}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: User Journey Timeline */}
      <div className="lg:col-span-8 flex flex-col glass-panel rounded-2xl overflow-hidden border border-white/5 h-full">
        {selectedSessionId ? (
          <>
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Session Journey Replay</span>
                <h3 className="text-lg font-semibold text-white font-mono">{selectedSessionId}</h3>
              </div>
              <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-xs text-[#9ca3af]">
                {events.length} chronological actions
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 relative">
              {loadingEvents ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-[#9ca3af]">Compiling session timeline...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#9ca3af]">
                  <p>No events found for this session.</p>
                </div>
              ) : (
                <div className="relative border-l border-white/10 ml-4 pl-8 space-y-6">
                  {events.map((e, index) => {
                    const isClick = e.event_type === 'click';
                    const relativeTime = getRelativeTime(e.timestamp, events[0].timestamp);
                    const pageName = getPageName(e.page_url);

                    return (
                      <div key={e._id} className="relative animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        {/* Timeline Node Icon */}
                        <span className={`absolute -left-[45px] top-0 flex items-center justify-center w-8 h-8 rounded-full border ${
                          isClick 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        }`}>
                          {isClick ? (
                            // Click cursor icon
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.672 1.914a1 1 0 00-1.066.52l-5 10A1 1 0 001.5 14h5v4.5a1 1 0 001.78.62l11-14a1 1 0 00-.78-1.614H10.5l-3.828-1.614z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            // Page/Document view icon
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </span>

                        {/* Event details block */}
                        <div className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all">
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-2 ${
                                isClick ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                              }`}>
                                {e.event_type.replace('_', ' ')}
                              </span>
                              <span className="text-sm font-semibold text-white">
                                Visited {pageName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-indigo-400 font-mono font-semibold bg-indigo-500/5 px-2 py-0.5 rounded">
                                {relativeTime}
                              </span>
                              <span className="text-[#9ca3af]">
                                {formatDate(e.timestamp)}
                              </span>
                            </div>
                          </div>

                          {/* Extra info based on event type */}
                          <div className="text-xs text-[#9ca3af] space-y-1">
                            <div className="flex gap-1 truncate">
                              <span className="font-semibold text-white/70">Full URL:</span>
                              <span className="truncate hover:underline cursor-pointer text-indigo-400/90">{e.page_url}</span>
                            </div>

                            {isClick && (
                              <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-white/5 font-mono text-[11px] text-[#34d399]">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                  </svg>
                                  Coordinates: X={e.x}px, Y={e.y}px
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-400">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Screen Size: {e.window_width}x{e.window_height}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 text-2xl">
              📍
            </div>
            <h3 className="text-lg font-semibold text-white">Select a Session</h3>
            <p className="text-sm text-[#9ca3af] max-w-sm mt-1">
              Select one of the sessions from the sidebar list to replay the chronological interactions step-by-step.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
