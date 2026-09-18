import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { CONFIG } from './config.js';
import { apiRouter } from './api/routes.js';
import { wsService } from './services/websocket.service.js';
import { db } from './database/db.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', apiRouter);

// Initialize WebSockets
wsService.initialize(server);

// Production Static Serving (if frontend dist exists)
const frontendDist = path.resolve(process.cwd(), '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <head><title>ZENO Backend</title></head>
          <body style="background:#111;color:#eee;font-family:sans-serif;padding:40px;text-align:center;">
            <h1>ZENO Backend Active</h1>
            <p>API is running at <a href="/api/status" style="color:#38bdf8;">/api/status</a></p>
            <p>Frontend development server runs on <a href="http://localhost:5173" style="color:#38bdf8;">http://localhost:5173</a></p>
          </body>
        </html>
      `);
    }
  });
});

// Start Server
server.listen(CONFIG.port, () => {
  console.log(`====================================================`);
  console.log(`  ZENO - Physical AI Voice Assistant Control Center`);
  console.log(`  "Listen. Think. Respond."`);
  console.log(`====================================================`);
  console.log(`  🚀 Backend Server running on http://localhost:${CONFIG.port}`);
  console.log(`  📡 WebSocket Gateway on ws://localhost:${CONFIG.port}/ws`);
  console.log(`  📊 REST API active at http://localhost:${CONFIG.port}/api/status`);
  console.log(`====================================================`);

  db.addLog({
    level: 'info',
    message: `ZENO Server initialized on port ${CONFIG.port}`,
    source: 'backend',
  });
});
