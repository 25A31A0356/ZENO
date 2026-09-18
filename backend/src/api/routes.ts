import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from '../database/db.js';
import { aiService } from '../services/ai.service.js';
import { deviceService } from '../services/device.service.js';
import { speechService } from '../services/speech.service.js';
import { visionService } from '../services/vision.service.js';
import { wsService } from '../services/websocket.service.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const apiRouter = Router();

// ==========================================
// 1. STATUS & SYSTEM HEALTH
// ==========================================

apiRouter.get('/status', (req: Request, res: Response) => {
  const device = db.getDevice();
  const state = deviceService.getCurrentState();
  const transcript = deviceService.getCurrentTranscript();
  const alerts = db.getAlerts().filter(a => !a.resolved);

  res.json({
    name: 'ZENO',
    tagline: 'Listen. Think. Respond.',
    overallStatus: !device.connected ? 'OFFLINE' : alerts.length > 0 ? 'WARNING' : 'ONLINE',
    state,
    transcript,
    device,
    alertsCount: alerts.length,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/system/health', (req: Request, res: Response) => {
  const device = db.getDevice();
  const conversations = db.getConversations(50);
  const avgResponseTime = conversations.length > 0
    ? Math.round(conversations.reduce((acc, c) => acc + (c.responseTimeMs || 1000), 0) / conversations.length)
    : 1100;

  const logs = db.getLogs(50);
  const errorsToday = logs.filter(l => l.level === 'error').length;

  res.json({
    status: 'healthy',
    message: device.connected ? 'Everything is working normally.' : 'ESP32 device is currently disconnected.',
    subsystems: {
      esp32: device.connected ? 'ONLINE' : 'OFFLINE',
      wifi: device.connected ? 'CONNECTED' : 'DISCONNECTED',
      backend: 'ONLINE',
      speechRecognition: 'READY',
      aiEngine: 'READY',
      textToSpeech: 'READY',
      database: 'CONNECTED',
    },
    metrics: {
      lastRequestTime: conversations[0]?.timestamp || new Date().toISOString(),
      averageResponseTimeMs: avgResponseTime,
      totalConversations: db.getConversations(200).length,
      errorsToday,
    },
  });
});

// ==========================================
// 2. DEVICE & HARDWARE CONTROLS
// ==========================================

apiRouter.get('/device', (req: Request, res: Response) => {
  res.json(db.getDevice());
});

apiRouter.get('/device/health', (req: Request, res: Response) => {
  const device = db.getDevice();
  res.json({
    deviceId: device.deviceId,
    connected: device.connected,
    batteryPercentage: device.batteryPercentage,
    batteryVoltage: device.batteryVoltage,
    isCharging: device.isCharging,
    wifiRssi: device.wifiRssi,
    uptimeSeconds: device.uptimeSeconds,
    lastSeen: device.lastSeen,
  });
});

apiRouter.post('/device/heartbeat', (req: Request, res: Response) => {
  const telemetry = req.body || {};
  const updated = deviceService.processHeartbeat(telemetry);
  res.json({ success: true, device: updated });
});

apiRouter.post('/device/lcd', (req: Request, res: Response) => {
  const { line1, line2 } = req.body;
  const updated = deviceService.updateLcd(line1 || '', line2 || '');
  res.json({ success: true, device: updated });
});

apiRouter.post('/device/test-speaker', (req: Request, res: Response) => {
  const { channel, volume } = req.body;
  const result = deviceService.testSpeaker(channel, volume);
  res.json(result);
});

apiRouter.post('/device/test-mic', (req: Request, res: Response) => {
  const result = deviceService.testMicrophone();
  res.json(result);
});

apiRouter.post('/device/test-display', (req: Request, res: Response) => {
  const updated = deviceService.updateLcd('ZENO Display', 'Test Verified OK');
  res.json({ success: true, message: 'LCD test pattern sent.', device: updated });
});

apiRouter.post('/device/restart', (req: Request, res: Response) => {
  const result = deviceService.restartDevice();
  res.json(result);
});

// ==========================================
// 3. CHAT & AI INTERACTION
// ==========================================

apiRouter.post('/chat', async (req: Request, res: Response) => {
  const { query, source = 'text' } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required.' });
  }

  try {
    // 1. Set State to LISTENING
    deviceService.setState('LISTENING', query);
    
    // 2. Set State to THINKING
    setTimeout(() => {
      deviceService.setState('THINKING', query);
    }, 400);

    // 3. Process with AI Engine + RAG
    const aiResult = await aiService.ask(query);

    // 4. Set State to SPEAKING
    deviceService.setState('SPEAKING', aiResult.answer);

    // 5. Store conversation
    const saved = db.addConversation({
      userQuery: query,
      zenoResponse: aiResult.answer,
      responseTimeMs: aiResult.responseTimeMs,
      source: source as any,
      retrievedKnowledge: aiResult.retrievedKnowledge,
    });

    // 6. Return to idle after speech interval
    const speechDuration = Math.min(Math.max(aiResult.answer.length * 50, 2000), 8000);
    setTimeout(() => {
      deviceService.setState('IDLE', 'Ready');
    }, speechDuration);

    res.json({
      conversation: saved,
      sources: aiResult.sources,
    });
  } catch (err: any) {
    deviceService.setState('ERROR', err.message || 'Chat error');
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

// ==========================================
// 4. SPEECH TO TEXT & TEXT TO SPEECH
// ==========================================

apiRouter.post('/speech-to-text', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file buffer is required.' });
  }
  const result = await speechService.transcribeAudio(req.file.buffer, req.file.mimetype);
  res.json(result);
});

apiRouter.post('/text-to-speech', async (req: Request, res: Response) => {
  const { text, voiceId } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required.' });
  }
  const result = await speechService.synthesizeSpeech(text, voiceId);
  res.json(result);
});

// ==========================================
// 5. CONVERSATIONS HISTORY
// ==========================================

apiRouter.get('/conversations', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  res.json(db.getConversations(limit));
});

apiRouter.delete('/conversations/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = db.deleteConversation(id);
  if (success) {
    res.json({ success: true, message: 'Conversation deleted.' });
  } else {
    res.status(404).json({ error: 'Conversation not found.' });
  }
});

apiRouter.delete('/conversations', (req: Request, res: Response) => {
  db.clearConversations();
  res.json({ success: true, message: 'All conversations cleared.' });
});

// ==========================================
// 6. TEACH ZENO (KNOWLEDGE, DOCS, Q&A)
// ==========================================

apiRouter.get('/knowledge', (req: Request, res: Response) => {
  res.json(db.getKnowledge());
});

apiRouter.post('/knowledge', (req: Request, res: Response) => {
  const { title, category, information, tags } = req.body;
  if (!title || !information) {
    return res.status(400).json({ error: 'Title and Information are required.' });
  }

  const created = db.addKnowledge({
    title,
    category: category || 'General',
    information,
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : [],
  });

  db.addLog({
    level: 'info',
    message: `Knowledge taught: "${title}" (${category || 'General'})`,
    source: 'ai',
  });

  res.status(201).json(created);
});

apiRouter.put('/knowledge/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updated = db.updateKnowledge(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Knowledge item not found.' });
  }
  res.json(updated);
});

apiRouter.delete('/knowledge/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = db.deleteKnowledge(id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Knowledge item not found.' });
  }
});

// Documents Upload
apiRouter.get('/documents', (req: Request, res: Response) => {
  res.json(db.getDocuments());
});

apiRouter.post('/documents', upload.single('document'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Document file is required.' });
  }

  // Extract raw plain text from buffer
  const extractedText = req.file.buffer.toString('utf-8');
  const chunks = extractedText.split(/\n\n+/).filter(c => c.trim().length > 0);

  const doc = db.addDocument({
    filename: `${Date.now()}_${req.file.originalname}`,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    chunkCount: Math.max(chunks.length, 1),
    extractedText,
    status: 'processed',
  });

  db.addLog({
    level: 'info',
    message: `Document ingested: "${req.file.originalname}" (${doc.chunkCount} knowledge chunks)`,
    source: 'ai',
  });

  res.status(201).json({
    success: true,
    document: doc,
    message: 'Document uploaded and processed. ZENO can now use this knowledge.',
  });
});

apiRouter.delete('/documents/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = db.deleteDocument(id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Document not found.' });
  }
});

// Q&A Pairs
apiRouter.get('/qa', (req: Request, res: Response) => {
  res.json(db.getQA());
});

apiRouter.post('/qa', (req: Request, res: Response) => {
  const { question, answer, category } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and Answer are required.' });
  }

  const qa = db.addQA({
    question,
    answer,
    category: category || 'General',
  });

  db.addLog({
    level: 'info',
    message: `Q&A taught: "${question}"`,
    source: 'ai',
  });

  res.status(201).json(qa);
});

apiRouter.delete('/qa/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = db.deleteQA(id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Q&A item not found.' });
  }
});

// ==========================================
// 7. VISION / CAMERA
// ==========================================

apiRouter.post('/vision/analyze', async (req: Request, res: Response) => {
  const { image, question } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image base64 data is required.' });
  }

  const result = await visionService.analyzeImage(image, question || 'What is this?');
  res.json(result);
});

// ==========================================
// 8. SETTINGS & LOGS & ALERTS
// ==========================================

apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json(db.getSettings());
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

apiRouter.get('/logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  res.json(db.getLogs(limit));
});

apiRouter.delete('/logs', (req: Request, res: Response) => {
  db.clearLogs();
  res.json({ success: true });
});

apiRouter.get('/alerts', (req: Request, res: Response) => {
  res.json(db.getAlerts());
});

apiRouter.post('/alerts/:id/resolve', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = db.resolveAlert(id);
  res.json({ success });
});

// ==========================================
// 9. PRESENTATION DEMO
// ==========================================

apiRouter.post('/demo/run', async (req: Request, res: Response) => {
  const result = await deviceService.runDemo();
  res.json(result);
});
