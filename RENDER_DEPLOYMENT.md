# Deploying Ethiopian Smart Queue Management System to Render

This guide outlines how to deploy this application to [Render](https://render.com) as a Web Service.

---

## 🚀 Quick Deployment Options

### Option 1: Automatic Blueprint (Recommended)
Because this repository contains `render.yaml`, you can use Render Blueprints:
1. Push your code to a GitHub or GitLab repository.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your Git repository.
5. Render will automatically detect `render.yaml` and configure:
   - **Runtime**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check**: `/api/health`
6. Fill in any required environment secrets (e.g. `GEMINI_API_KEY`, `MONGODB_URI` if connecting to MongoDB Atlas).
7. Click **Apply**.

---

### Option 2: Manual Web Service Setup
If creating the Web Service manually:
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your repository.
3. Configure the following settings:
   - **Name**: `ethiopian-smart-queue` (or your preferred name)
   - **Region**: Any (e.g. Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` or `Starter`

4. Under **Advanced** → **Health Check Path**, enter:
   `/api/health`

5. Add **Environment Variables**:
   | Key | Value / Description |
   |---|---|
   | `NODE_ENV` | `production` |
   | `JWT_ACCESS_SECRET` | Any long random string for token signing |
   | `JWT_REFRESH_SECRET` | Any long random string for token refreshing |
   | `GEMINI_API_KEY` | *(Optional)* Your Google Gemini API Key for Addis AI Voice & announcements |
   | `MONGODB_URI` | *(Optional)* Connection string for MongoDB Atlas (app has in-memory fallback if omitted) |
   | `MONGODB_DB_NAME` | `office_queue_db` |

6. Click **Create Web Service**.

---

## ⚙️ Architecture & Build Verification

- **Frontend**: React 19 + Tailwind CSS + Lucide Icons + Recharts, bundled into static files in `dist/` via `vite build`.
- **Backend Server**: Bundled into a standalone Node server `dist/server.cjs` via `esbuild`.
- **WebSocket & SSE**: Supports real-time ticket display updates and multi-screen synchronization out of the box.
- **Port Handling**: Render routes HTTP and WebSocket traffic seamlessly to port 3000 or the dynamically assigned environment port.
