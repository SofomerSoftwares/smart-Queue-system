# Production Deployment Guide

## 1. Prerequisites
- Node.js >= 20.0.0
- npm or yarn / bun
- MongoDB Atlas cluster URI (optional; in-memory fallback is active if omitted)

---

## 2. Environment Configuration
Create a `.env` file from `.env.example`:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/queue_db?retryWrites=true&w=majority
JWT_SECRET=production_secret_key_change_me
GEMINI_API_KEY=your_gemini_api_key_if_applicable
VITE_ENABLE_TTS=true
```

---

## 3. Build & Run
```bash
# 1. Install production dependencies
npm install

# 2. Build frontend and backend bundle
npm run build

# 3. Start production server
npm start
```

The Express server serves the optimized Vite SPA bundle from `dist/` and runs the API and real-time SSE stream on port 3000.
