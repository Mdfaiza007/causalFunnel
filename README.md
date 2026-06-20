# CausalFunnel Analytics — Full Stack Assignment

A full-stack user analytics tracking system that records user sessions (page views and clicks), stores interactions in MongoDB Atlas, and presents them in a beautiful, space-themed React dashboard with a **Session Journey Replay** and **Coordinate Heatmap View**.

---

## 🚀 Live Demo
- **Dashboard:** https://causal-funnel-theta.vercel.app
- **Demo Tracker Page:** https://causalfunnel-lm4v.onrender.com/tracker/demo.html

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, Tailwind CSS v4 |
| **Backend** | Node.js, Express.js, Morgan, CORS |
| **Database** | MongoDB Atlas (cloud) via Mongoose ODM |
| **Tracker Script** | Vanilla JavaScript (IIFE, no dependencies) |

---

## 📁 Project Structure

```
causalFunnel/
├── backend/               # Express API server
│   ├── controllers/
│   │   └── eventController.js   # All API logic
│   ├── models/
│   │   └── Event.js             # Mongoose schema
│   ├── routes/
│   │   └── api.js               # Route definitions
│   ├── server.js                # Entry point
│   ├── .env                     # Environment variables (not committed)
│   └── .env.example             # Template for env variables
│
├── frontend/              # Vite + React dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── SessionsView.tsx   # Sessions journey feed
│   │   │   └── HeatmapView.tsx    # Click heatmap visualizer
│   │   ├── lib/
│   │   │   └── api.ts             # Typed API client functions
│   │   └── App.tsx                # Main layout + routing
│   └── .env                      # VITE_API_URL (not committed)
│
└── tracker/               # Client-side tracking script
    ├── tracker.js          # Embeddable tracking IIFE
    └── demo.html           # Demo landing page for testing
```

---

## ⚙️ Setup & Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A MongoDB Atlas account **or** local MongoDB on port `27017`

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/<your-username>/causalFunnel.git
cd causalFunnel
```

---

### Step 2: Configure and Start the Backend

```bash
cd backend
npm install
```

Create a `.env` file (or copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/user_analytics
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

✅ Backend runs on **`http://localhost:5000`**

Output:
```
Analytics Backend Server running on port 5000
Successfully connected to MongoDB.
```

---

### Step 3: Configure and Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the Vite dev server:

```bash
npm run dev
```


---

### Step 4: Generate Demo Events

1. Open the demo tracking page in your browser:
   ```
   http://localhost:5000/tracker/demo.html
   ```
2. Click around on the buttons, cards, and navigation links to generate events.
3. Use the **"Reset Session"** button (bottom-right widget) to simulate a new user.
4. Navigate to the dashboard: **`http://localhost:5173`**
5. Explore:
   - **Sessions Journey Feed** — click any session to see its full chronological interaction timeline.
   - **Page Click Heatmaps** — select a tracked URL from the dropdown to see click hotspots overlaid on a layout wireframe.

---





### Tracker Script (on any page)

Once backend is live, embed the tracker on any HTML page:

```html
<script
  src="https://your-backend.onrender.com/tracker/tracker.js"
  data-api-url="https://your-backend.onrender.com"
></script>
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events` | Record a single or batch of events |
| `GET` | `/api/sessions` | List all sessions with event counts |
| `GET` | `/api/sessions/:sessionId/events` | Get all events for a session (chronological) |
| `GET` | `/api/heatmap?page=<url>` | Get click coordinates for a page |

---

## 🗄️ Data Model

```js
// MongoDB Event Document
{
  session_id:    String,   // UUID stored in localStorage
  event_type:    String,   // "page_view" | "click"
  page_url:      String,   // Full URL at time of event
  timestamp:     Date,     // ISO timestamp
  x:             Number,   // Click X coordinate (pageX)
  y:             Number,   // Click Y coordinate (pageY)
  window_width:  Number,   // Browser viewport width at click
  window_height: Number    // Browser viewport height at click
}
```

**Indexes:**
- `{ session_id: 1, timestamp: 1 }` — fast chronological session queries
- `{ page_url: 1, event_type: 1 }` — fast heatmap data filtering

---

## 🔑 Key Technical Decisions & Trade-offs

### 1. Session Management via localStorage
Session IDs are generated as UUID v4 strings and stored in `localStorage`. A **30-minute inactivity timeout** automatically creates a new session — matching industry-standard analytics tools like Google Analytics. This avoids combining multiple days of browsing into one session.

**Trade-off:** `localStorage` is per-origin, so cross-origin tracking requires the script embed with explicit `data-api-url`. Cookie-based sessions would be more portable but require SameSite/CORS policy adjustments.

### 2. Multi-Resolution Coordinate Normalization (Heatmaps)
Users click on different screen sizes. If a click occurs at X=960 on a 1920px screen, but the dashboard mock is 800px wide, the dot must be repositioned:

```
X_render = X_original × (800 / window_width_original)
```

This guarantees hotspots align correctly over layout elements regardless of the user's screen resolution.

**Trade-off:** We use a static 800px wireframe instead of a live screenshot. A production system would use a DOM snapshot service (e.g., Puppeteer) to capture the actual page for the background.

### 3. CSS Radial Gradient Heatmap (No Canvas Library)
Instead of loading `heatmap.js` or `d3`, each click coordinate is rendered as an absolutely positioned `div` with a radial gradient:

```css
background: radial-gradient(circle, rgba(239, 68, 68, 0.65) 0%, transparent 80%)
```

When multiple clicks cluster together, their opacity naturally compounds, creating a visual "heat" effect.

**Trade-off:** Overlapping radial gradients are not as mathematically precise as kernel density estimation (KDE) used in professional tools, but they are lightweight, dependency-free, and visually effective for this scale.

### 4. Single Event Collection per Click (No Batching)
Each click dispatches an immediate `fetch()` request to the API. This simplifies the implementation and keeps latency visible in real time.

**Trade-off:** At scale, this creates high request volume. A production system would buffer events in a local queue and flush them in batches (every 5 seconds, or on page unload via `navigator.sendBeacon()`).

---

## 🔮 Future Enhancements

1. **Event Batching** — buffer clicks locally and flush to API every 5 seconds to reduce network overhead.
2. **Real Page Screenshots** — use Puppeteer to capture actual page snapshots as heatmap backgrounds instead of a static wireframe.
3. **MongoDB Aggregation Buckets** — pre-compile click coordinates into spatial buckets for large-scale queries.
4. **Auth & Rate Limiting** — protect API endpoints with JWT tokens and rate limiters to prevent data pollution.
5. **Scroll Depth Tracking** — capture `scrollY` events alongside clicks for full scroll heatmaps.
