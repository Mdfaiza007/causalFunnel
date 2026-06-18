import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';

// Load environment configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/user_analytics';

// ES Module dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors()); // Allow cross-origin requests (e.g. from frontend dashboard, embedded sites)
app.use(express.json());
app.use(morgan('dev')); // Dev logs for API endpoints

// Database connection
console.log('Connecting to MongoDB at:', MONGODB_URI);
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB. Please make sure MongoDB is running locally or check your MONGODB_URI in the environment variables.');
    console.error(err);
  });

// API Routes mounting
app.use('/api', apiRoutes);

// Serve Tracker script and Demo page statically for easy local testing
// This maps localhost:5000/tracker/ to the tracker directory
app.use('/tracker', express.static(path.join(__dirname, '../tracker')));

// Health check and root route
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'User Analytics API is running.',
    endpoints: {
      postEvent: 'POST /api/events',
      getSessions: 'GET /api/sessions',
      getSessionEvents: 'GET /api/sessions/:sessionId/events',
      getHeatmap: 'GET /api/heatmap?page=<page_url>'
    },
    tracker: 'http://localhost:' + PORT + '/tracker/demo.html'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`  Analytics Backend Server running on port ${PORT}`);
  console.log(`  API Base URL: http://localhost:${PORT}/api`);
  console.log(`  Demo Page URL: http://localhost:${PORT}/tracker/demo.html`);
  console.log(`========================================================`);
});
