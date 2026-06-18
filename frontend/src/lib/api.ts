const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export type Session = {
  session_id: string;
  total_events: number;
  started_at: string;
  last_active: string;
};

export type TrackedEvent = {
  _id: string;
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: string;
  x?: number;
  y?: number;
  window_width?: number;
  window_height?: number;
};

export type HeatmapResponse = {
  clicks: Array<{
    _id: string;
    session_id: string;
    page_url: string;
    timestamp: string;
    x: number;
    y: number;
    window_width: number;
    window_height: number;
  }>;
  pages: string[];
};

/**
 * Fetches all aggregated user sessions sorted by last activity.
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sessions`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error('Failed fetching sessions:', error);
    return [];
  }
}

/**
 * Fetches all events associated with a specific session, sorted chronologically.
 */
export async function getSessionEvents(sessionId: string): Promise<TrackedEvent[]> {
  try {
    if (!sessionId) return [];
    const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/events`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error(`Failed fetching events for session ${sessionId}:`, error);
    return [];
  }
}

/**
 * Fetches click events for a specific page url, along with unique URLs list.
 */
export async function getHeatmapData(pageUrl: string): Promise<HeatmapResponse> {
  try {
    const encodedPage = encodeURIComponent(pageUrl);
    const res = await fetch(`${API_BASE_URL}/api/heatmap?page=${encodedPage}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.success ? json.data : { clicks: [], pages: [] };
  } catch (error) {
    console.error(`Failed fetching heatmap data for page ${pageUrl}:`, error);
    return { clicks: [], pages: [] };
  }
}

/**
 * Fetches list of all unique tracked page urls to populate the select inputs.
 * Useful if we don't have click events yet, we can pass any placeholder to /api/heatmap.
 */
export async function getTrackedPages(): Promise<string[]> {
  try {
    // Calling with empty page returns pages array too
    const res = await fetch(`${API_BASE_URL}/api/heatmap?page=placeholder`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.success ? json.data.pages : [];
  } catch (error) {
    console.error('Failed fetching tracked pages:', error);
    return [];
  }
}
