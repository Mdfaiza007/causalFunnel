import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['page_view', 'click']
  },
  page_url: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  x: {
    type: Number,
    required: false
  },
  y: {
    type: Number,
    required: false
  },
  window_width: {
    type: Number,
    required: false
  },
  window_height: {
    type: Number,
    required: false
  }
}, {
  timestamps: false // We use our own tracking timestamp
});

// Compound index for quick session-based event flows
eventSchema.index({ session_id: 1, timestamp: 1 });
// Compound index for heatmap data query on a page
eventSchema.index({ page_url: 1, event_type: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
