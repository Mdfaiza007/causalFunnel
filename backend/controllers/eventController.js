import Event from '../models/Event.js';

/**
 * Helper to validate a single event object
 */
const validateEventData = (data) => {
  if (!data.session_id || typeof data.session_id !== 'string') {
    return 'Missing or invalid session_id';
  }
  if (!data.event_type || !['page_view', 'click'].includes(data.event_type)) {
    return 'Missing or invalid event_type (must be page_view or click)';
  }
  if (!data.page_url || typeof data.page_url !== 'string') {
    return 'Missing or invalid page_url';
  }
  if (data.event_type === 'click') {
    if (typeof data.x !== 'number' || typeof data.y !== 'number') {
      return 'Missing or invalid x/y coordinates for click event';
    }
  }
  return null;
};

/**
 * POST /api/events
 * Receives one event or an array of events (batching) and stores them in MongoDB.
 */
export const createEvent = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    const eventsToInsert = [];

    // Handle batch of events
    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        return res.status(400).json({ success: false, error: 'Empty batch provided' });
      }

      for (let i = 0; i < payload.length; i++) {
        const error = validateEventData(payload[i]);
        if (error) {
          return res.status(400).json({ success: false, error: `Error at index ${i}: ${error}` });
        }
        
        eventsToInsert.push({
          session_id: payload[i].session_id,
          event_type: payload[i].event_type,
          page_url: payload[i].page_url,
          timestamp: payload[i].timestamp ? new Date(payload[i].timestamp) : new Date(),
          x: payload[i].x,
          y: payload[i].y,
          window_width: payload[i].window_width,
          window_height: payload[i].window_height
        });
      }
    } else {
      // Handle single event
      const error = validateEventData(payload);
      if (error) {
        return res.status(400).json({ success: false, error });
      }

      eventsToInsert.push({
        session_id: payload.session_id,
        event_type: payload.event_type,
        page_url: payload.page_url,
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        x: payload.x,
        y: payload.y,
        window_width: payload.window_width,
        window_height: payload.window_height
      });
    }

    const savedEvents = await Event.insertMany(eventsToInsert);
    return res.status(201).json({
      success: true,
      message: `${savedEvents.length} event(s) recorded successfully`,
      data: savedEvents
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/sessions
 * Returns a list of all unique sessions, with total event count, started_at, and last_active.
 */
export const getSessions = async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          started_at: { $min: '$timestamp' },
          last_active: { $max: '$timestamp' }
        }
      },
      {
        $sort: { last_active: -1 } // Show active sessions first
      }
    ]);

    // Format list for frontend convenience
    const formattedSessions = sessions.map(s => ({
      session_id: s._id,
      total_events: s.total_events,
      started_at: s.started_at,
      last_active: s.last_active
    }));

    return res.status(200).json({
      success: true,
      count: formattedSessions.length,
      data: formattedSessions
    });
  } catch (error) {
    console.error('Error retrieving sessions:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/sessions/:sessionId/events
 * Returns all events for a specific session, sorted chronologically.
 */
export const getSessionEvents = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const events = await Event.find({ session_id: sessionId })
      .sort({ timestamp: 1 }); // Chronological order

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error(`Error retrieving events for session ${req.params.sessionId}:`, error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/heatmap
 * Query params: page=<page_url>
 * Returns all click events (with x/y coordinates) for a given page URL.
 */
export const getHeatmapData = async (req, res) => {
  try {
    const { page } = req.query;

    if (!page) {
      return res.status(400).json({ success: false, error: 'Page URL query parameter is required' });
    }

    // Retrieve only click events for the given page URL
    const clicks = await Event.find({
      page_url: page,
      event_type: 'click'
    }).select('session_id page_url timestamp x y window_width window_height');

    // Also get list of all unique page URLs tracked, to populate filters on dashboard
    const uniquePages = await Event.distinct('page_url');

    return res.status(200).json({
      success: true,
      count: clicks.length,
      data: {
        clicks,
        pages: uniquePages
      }
    });
  } catch (error) {
    console.error(`Error retrieving heatmap data for page ${req.query.page}:`, error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
