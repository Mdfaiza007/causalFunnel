import express from 'express';
import {
  createEvent,
  getSessions,
  getSessionEvents,
  getHeatmapData
} from '../controllers/eventController.js';

const router = express.Router();

// Route for recording tracking events (single or batch)
router.post('/events', createEvent);

// Route for fetching session statistics
router.get('/sessions', getSessions);

// Route for fetching timeline journey events of a specific session
router.get('/sessions/:sessionId/events', getSessionEvents);

// Route for fetching click coordinates for page heatmap overlays
router.get('/heatmap', getHeatmapData);

export default router;
