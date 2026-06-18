import { useState, useEffect, useRef } from 'react';
import { getHeatmapData, getTrackedPages } from '../lib/api';
import type { HeatmapResponse } from '../lib/api';

export default function HeatmapView() {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [clicks, setClicks] = useState<HeatmapResponse['clicks']>([]);
  const [loading, setLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [dotSize, setDotSize] = useState<number>(24);
  const [dotColor, setDotColor] = useState<string>('rgba(239, 68, 68, 0.6)'); // default red/coral
  const [hoveredClick, setHoveredClick] = useState<typeof clicks[0] | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load unique pages on mount
  useEffect(() => {
    loadPages();
  }, []);

  // Fetch heatmap data when page changes
  useEffect(() => {
    if (selectedPage) {
      loadHeatmap(selectedPage);
    }
  }, [selectedPage]);

  const loadPages = async () => {
    setPagesLoading(true);
    try {
      // Primary: use getTrackedPages endpoint
      let trackedPages = await getTrackedPages();

      // Fallback: if empty, try fetching via heatmap API directly (also returns all pages)
      if (!trackedPages || trackedPages.length === 0) {
        const fallback = await getHeatmapData('placeholder');
        trackedPages = fallback.pages || [];
      }

      setPages(trackedPages);
      if (trackedPages.length > 0) {
        // Look for demo.html or take first page
        const demoPage = trackedPages.find(p => p.includes('demo.html'));
        setSelectedPage(demoPage || trackedPages[0]);
      }
    } catch (err) {
      console.error('[HeatmapView] Failed to load tracked pages:', err);
    } finally {
      setPagesLoading(false);
    }
  };

  const loadHeatmap = async (pageUrl: string) => {
    setLoading(true);
    const data = await getHeatmapData(pageUrl);
    setClicks(data.clicks);
    // Refresh page list too
    if (data.pages && data.pages.length > 0) {
      setPages(data.pages);
    }
    setLoading(false);
  };

  // Helper: Extract page path for dropdown representation
  const getPageLabel = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-wrap justify-between items-center gap-4 animate-fade-in">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">Heatmap Visualizer</h3>
          <p className="text-xs text-[#9ca3af]">Select a tracked page to render click distributions</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Page Selector Dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider">Tracked Page URL</span>
            {pagesLoading ? (
              <div className="flex items-center gap-2 min-w-[240px] bg-[#0d1226]/80 border border-white/10 rounded-xl px-4 py-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-[#9ca3af]">Loading pages...</span>
              </div>
            ) : pages.length === 0 ? (
              <div className="flex items-center gap-2 min-w-[240px] bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2">
                <span className="text-sm text-rose-400">⚠ No tracked pages found</span>
              </div>
            ) : (
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="bg-[#0d1226]/80 text-white border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 min-w-[240px]"
              >
                {pages.map((p) => (
                  <option key={p} value={p}>
                    {getPageLabel(p)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dot Density Configuration */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider">Spot Diameter</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="12"
                max="60"
                value={dotSize}
                onChange={(e) => setDotSize(Number(e.target.value))}
                className="w-24 accent-indigo-500"
              />
              <span className="text-xs text-white/95 font-mono">{dotSize}px</span>
            </div>
          </div>

          {/* Hotspot Intensity Style */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider">Heat Signature</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setDotColor('rgba(239, 68, 68, 0.65)')}
                className={`w-6 h-6 rounded-full bg-rose-500 border-2 ${dotColor.includes('239') ? 'border-white' : 'border-transparent'}`}
                title="Thermal Red"
              />
              <button 
                onClick={() => setDotColor('rgba(234, 179, 8, 0.65)')}
                className={`w-6 h-6 rounded-full bg-yellow-500 border-2 ${dotColor.includes('234') ? 'border-white' : 'border-transparent'}`}
                title="Warning Yellow"
              />
              <button 
                onClick={() => setDotColor('rgba(6, 182, 212, 0.65)')}
                className={`w-6 h-6 rounded-full bg-cyan-500 border-2 ${dotColor.includes('182') ? 'border-white' : 'border-transparent'}`}
                title="Neon Cyan"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadHeatmap(selectedPage)}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-xl flex items-center gap-1.5 transition-all self-end"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        {/* Left Side: Heatmap Stats */}
        <div className="xl:col-span-1 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <h4 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">Metrics summary</h4>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-[#9ca3af]">Total Heat Clicks</span>
                <p className="text-3xl font-extrabold text-white font-mono">{clicks.length}</p>
              </div>
              <div className="pt-3 border-t border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Tracking Page:</span>
                  <span className="text-white/80 font-medium truncate max-w-[150px]">{getPageLabel(selectedPage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Streaming
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 text-xs space-y-3">
            <h4 className="text-sm font-semibold text-white/90">How coordinates scale:</h4>
            <p className="text-[#9ca3af] leading-relaxed">
              Clicks happen on varying browser widths. To plot them accurately, this viewer reads each click's original screen size and scales coordinates relative to our <b>800px mockup container</b>:
            </p>
            <div className="bg-[#0d1226] p-3 rounded-lg border border-white/5 font-mono text-[10px] text-indigo-300">
              X_render = X_orig * (800 / width_orig)<br/>
              Y_render = Y_orig * (800 / width_orig)
            </div>
            <p className="text-[#9ca3af] leading-relaxed">
              This overlays hotspots exactly over the respective mock CTA buttons, cards, and navigation links.
            </p>
          </div>
        </div>

        {/* Right Side: Visual Mockup + Heat dots */}
        <div className="xl:col-span-3 flex justify-center">
          <div className="w-full max-w-[850px] bg-[#0c0e1a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl p-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-xs text-[#9ca3af] font-mono ml-2">Rendered Canvas (width: 800px)</span>
              </div>
              
              {hoveredClick && (
                <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                  Hovered Click: ({hoveredClick.x}, {hoveredClick.y}) | screen: {hoveredClick.window_width}px
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-[600px] space-y-3">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-[#9ca3af]">Generating visual coordinate heat nodes...</p>
              </div>
            ) : clicks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-center border-2 border-dashed border-white/5 rounded-xl">
                <span className="text-4xl mb-2">🔥</span>
                <p className="text-sm font-semibold text-white">No click events registered yet</p>
                <p className="text-xs text-[#9ca3af] max-w-xs mt-1">
                  Open <b>tracker/demo.html</b>, click on sections/buttons, and click refresh above to see heat spots.
                </p>
              </div>
            ) : (
              // Scrollable container for the scaled mock page
              <div className="overflow-x-auto overflow-y-auto max-h-[700px] flex justify-center bg-[#070913] rounded-xl border border-white/5 relative">
                {/* 800px page representation */}
                <div
                  ref={canvasRef}
                  id="heatmap-container"
                  className="w-[800px] min-h-[1200px] bg-[#0a0f1d] relative text-white/90 select-none shadow-2xl transition-all animate-fade-in"
                  style={{
                    height: '1500px' // locked height for mock site layout
                  }}
                >
                  {/* --- MOCK SITE LAYOUT DESIGN LAYER --- */}
                  
                  {/* Header Wireframe */}
                  <div className="h-[65px] border-b border-white/10 bg-[#0a0f1d]/90 px-6 flex justify-between items-center text-xs pointer-events-none opacity-40">
                    <div className="font-bold text-white tracking-wide">CausalFunnel Analytics</div>
                    <div className="flex gap-4 text-[#9ca3af]">
                      <span>Home</span>
                      <span>Features</span>
                      <span>Interactive Zone</span>
                      <span>About</span>
                    </div>
                  </div>

                  {/* Hero Section Wireframe */}
                  <div className="h-[420px] border-b border-white/5 px-8 pt-[70px] text-center flex flex-col items-center pointer-events-none opacity-30">
                    <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">INTELLIGENT INSIGHTS</div>
                    <h2 className="text-2xl font-bold leading-snug max-w-[500px] mb-4">Transform Clicks Into Actionable Insights</h2>
                    <p className="text-xs text-[#9ca3af] max-w-[420px] mb-6">A simple, lightweight full-stack session journey tracker and heatmap generator. Monitor visual patterns and study user interactions.</p>
                    <div className="flex gap-3">
                      <div className="px-5 py-2 rounded-full bg-indigo-500 text-white font-semibold text-[10px]">Try Interactive Buttons</div>
                      <div className="px-5 py-2 rounded-full border border-white/10 text-white font-semibold text-[10px]">Learn More</div>
                    </div>
                  </div>

                  {/* Features Grid Wireframe */}
                  <div className="h-[450px] border-b border-white/5 pt-12 px-6 pointer-events-none opacity-30">
                    <div className="text-center mb-8">
                      <h3 className="text-lg font-bold">Interactive Product Offerings</h3>
                      <p className="text-[11px] text-[#9ca3af]">Click on any card below to register a distinct click coordinate</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Card 1 */}
                      <div className="border border-white/10 bg-[#121829]/60 rounded-xl p-4 h-[180px] text-left">
                        <span className="text-lg">👥</span>
                        <h4 className="text-xs font-bold mt-2 mb-1">Session Replays</h4>
                        <p className="text-[10px] text-[#9ca3af]">Follow exact scroll patterns and ordered interactions.</p>
                      </div>
                      {/* Card 2 */}
                      <div className="border border-white/10 bg-[#121829]/60 rounded-xl p-4 h-[180px] text-left">
                        <span className="text-lg">🔥</span>
                        <h4 className="text-xs font-bold mt-2 mb-1">Visual Heatmaps</h4>
                        <p className="text-[10px] text-[#9ca3af]">Coordinate density maps compiled directly from click feeds.</p>
                      </div>
                      {/* Card 3 */}
                      <div className="border border-white/10 bg-[#121829]/60 rounded-xl p-4 h-[180px] text-left">
                        <span className="text-lg">⚡</span>
                        <h4 className="text-xs font-bold mt-2 mb-1">Instant Integration</h4>
                        <p className="text-[10px] text-[#9ca3af]">Drop a single line of script tag into your layouts.</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Zone Wireframe */}
                  <div className="h-[350px] border-b border-white/5 pt-12 px-8 pointer-events-none opacity-30 text-center">
                    <h3 className="text-lg font-bold mb-1">Interactive Event Zone</h3>
                    <p className="text-[11px] text-[#9ca3af] mb-6">Generate various types of events here.</p>
                    <div className="border border-dashed border-white/10 bg-[#121829]/20 rounded-2xl p-6 max-w-[600px] mx-auto">
                      <h4 className="text-xs font-semibold mb-4">Call-to-Action Testing</h4>
                      <div className="flex justify-center gap-4">
                        <div className="px-4 py-2 rounded bg-blue-500 text-white font-bold text-[10px]">Primary Action</div>
                        <div className="px-4 py-2 rounded bg-emerald-500 text-white font-bold text-[10px]">Submit Feedback</div>
                        <div className="px-4 py-2 rounded bg-rose-500 text-white font-bold text-[10px]">Cancel Operation</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Wireframe */}
                  <div className="h-[150px] pt-8 pointer-events-none opacity-35 text-center text-[10px] text-[#9ca3af]">
                    <p>© 2026 CausalFunnel Analytics Demo. All rights reserved.</p>
                    <p className="mt-2 text-indigo-400">Back to Top | Documentation</p>
                  </div>

                  {/* --- HEATMAP OVERLAY DOTS LAYER --- */}
                  <div className="absolute inset-0 z-50 pointer-events-auto">
                    {clicks.map((click) => {
                      // Normalize coordinate points
                      // Dashboard mock container width is fixed at 800px
                      const renderWidth = 800;
                      // Fallback original width to renderWidth if not tracked
                      const originalWidth = click.window_width || renderWidth;
                      
                      // Calculate scale factor
                      const scale = renderWidth / originalWidth;
                      
                      // Compute scaled position
                      const leftPos = click.x * scale;
                      const topPos = click.y * scale;

                      // Make sure dot positions do not fall outside the boundaries
                      if (leftPos < 0 || leftPos > 800 || topPos < 0 || topPos > 1500) {
                        return null; // Skip invalid out of bound clicks
                      }

                      return (
                        <div
                          key={click._id}
                          className="heat-dot absolute rounded-full cursor-pointer hover:ring-2 hover:ring-white transition-shadow"
                          style={{
                            left: `${leftPos}px`,
                            top: `${topPos}px`,
                            width: `${dotSize}px`,
                            height: `${dotSize}px`,
                            transform: 'translate(-50%, -50%)',
                            background: `radial-gradient(circle, ${dotColor} 0%, transparent 80%)`,
                          }}
                          onMouseEnter={() => setHoveredClick(click)}
                          onMouseLeave={() => setHoveredClick(null)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
