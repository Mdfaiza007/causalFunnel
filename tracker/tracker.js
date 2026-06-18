(function () {
  // 1. Script Configuration
  // Retrieve backend API URL from script attribute if defined, otherwise default to port 5000
  const currentScript = document.currentScript;
  const API_BASE_URL = (currentScript && currentScript.getAttribute('data-api-url')) || 'http://localhost:5000';
  const SEND_EVENT_URL = `${API_BASE_URL}/api/events`;

  const SESSION_KEY = 'cf_analytics_session_id';
  const SESSION_TS_KEY = 'cf_analytics_session_last_active';
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes inactivity timeout

  // Helper: Generate a unique ID (UUID v4 approximation)
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Helper: Fetch or initialize Session ID
  function getSessionId() {
    const now = Date.now();
    let sessionId = localStorage.getItem(SESSION_KEY);
    const lastActive = localStorage.getItem(SESSION_TS_KEY);

    // If session doesn't exist, or last activity was over 30 mins ago, reset session
    if (!sessionId || !lastActive || (now - parseInt(lastActive, 10)) > SESSION_TIMEOUT) {
      sessionId = generateUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
      console.log('[Analytics] New session started:', sessionId);
    }

    // Refresh last active timestamp
    localStorage.setItem(SESSION_TS_KEY, now.toString());
    return sessionId;
  }

  // Refresh active timestamp on new activity
  function refreshSession() {
    localStorage.setItem(SESSION_TS_KEY, Date.now().toString());
  }

  // 2. Dispatch Event helper
  function sendEvent(eventType, additionalData = {}) {
    const sessionId = getSessionId();
    
    const payload = {
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    // Use sendBeacon if available and page is unloading, otherwise standard fetch
    // For general reliability during sessions, fetch is great
    fetch(SEND_EVENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true // Allows request to outlive the page during transition
    })
    .then(response => {
      if (!response.ok) {
        console.warn('[Analytics] Failed to send event:', response.statusText);
      }
    })
    .catch(error => {
      console.error('[Analytics] Network error sending event:', error);
    });
  }

  // 3. Track Page View
  function trackPageView() {
    sendEvent('page_view');
  }

  // 4. Track Click Coordinates
  function trackClick(e) {
    refreshSession();

    // Capture click position relative to the entire document page width/height
    const clickX = e.pageX;
    const clickY = e.pageY;

    // Viewport dimensions at the time of click
    const wWidth = window.innerWidth;
    const wHeight = window.innerHeight;

    // Optional debug metadata
    const targetElement = e.target;
    const targetTagName = targetElement.tagName.toLowerCase();
    const targetText = (targetElement.innerText || targetElement.value || '').substring(0, 30).trim();

    sendEvent('click', {
      x: clickX,
      y: clickY,
      window_width: wWidth,
      window_height: wHeight
    });
  }

  // Initialize listeners
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }

  // Bind click listener to the entire document
  document.addEventListener('click', trackClick);

  console.log('[Analytics] Tracker script initialized successfully. Session ID:', getSessionId());
})();
