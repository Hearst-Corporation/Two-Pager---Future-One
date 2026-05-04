// proxy.js — Runway API proxy (anti-CORS)
// Usage: node proxy.js
// Écoute sur http://localhost:3099

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3099;
const RUNWAY_BASE = 'api.dev.runwayml.com';
const RUNWAY_VERSION = '2024-11-06';
const TASKS_LOG = path.join(__dirname, 'runway-tasks.log');

function logTask(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(TASKS_LOG, line);
}

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
}

const server = http.createServer((req, res) => {
  corsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing X-API-Key header' }));
  }

  // ── POST /runway/generate → POST https://api.runwayml.com/v1/image_to_video
  if (req.method === 'POST' && req.url === '/runway/generate') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); } catch {
        res.writeHead(400); return res.end('Bad JSON');
      }

      const runwayBody = JSON.stringify({
        model: payload.model || 'gen4_turbo',
        promptImage: payload.promptImage,
        promptText: payload.promptText || '',
        duration: payload.duration || 10,
        ratio: payload.ratio || '1280:768',
        watermark: false,
      });

      const options = {
        hostname: RUNWAY_BASE,
        path: '/v1/image_to_video',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': RUNWAY_VERSION,
          'Content-Length': Buffer.byteLength(runwayBody),
        },
      };

      const proxyReq = https.request(options, proxyRes => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          corsHeaders(res);
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
          // PERSIST tasks → on garde l'UUID complet et le prompt pour pouvoir récupérer
          try {
            const parsed = JSON.parse(data);
            logTask({
              event: 'submit',
              status: proxyRes.statusCode,
              taskId: parsed.id || null,
              promptText: payload.promptText,
              duration: payload.duration,
              ratio: payload.ratio,
              model: payload.model,
              error: parsed.error || null,
            });
          } catch (e) {
            logTask({ event: 'submit', status: proxyRes.statusCode, raw: data.slice(0, 200) });
          }
          console.log(`[generate] ${proxyRes.statusCode} — ${data.slice(0, 120)}`);
        });
      });

      proxyReq.on('error', err => {
        console.error('[generate error]', err.message);
        res.writeHead(500); res.end(err.message);
      });
      proxyReq.write(runwayBody);
      proxyReq.end();
    });

  // ── GET /runway/status/:taskId → GET https://api.runwayml.com/v1/tasks/:id
  } else if (req.method === 'GET' && req.url.startsWith('/runway/status/')) {
    const taskId = req.url.split('/runway/status/')[1];
    const options = {
      hostname: RUNWAY_BASE,
      path: `/v1/tasks/${taskId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': RUNWAY_VERSION,
      },
    };

    const proxyReq = https.request(options, proxyRes => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        corsHeaders(res);
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'SUCCEEDED' || parsed.status === 'FAILED') {
            logTask({
              event: parsed.status.toLowerCase(),
              taskId: taskId,
              outputUrl: parsed.output && parsed.output[0] || null,
              failure: parsed.failure || null,
            });
          }
          console.log(`[poll] ${taskId.slice(0,8)}... → ${parsed.status}`);
        } catch (e) {}
      });
    });

    proxyReq.on('error', err => {
      console.error('[poll error]', err.message);
      res.writeHead(500); res.end(err.message);
    });
    proxyReq.end();

  } else {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n  Runway Proxy démarré sur http://localhost:${PORT}`);
  console.log(`  Routes disponibles :`);
  console.log(`    POST /runway/generate`);
  console.log(`    GET  /runway/status/:taskId\n`);
});
