const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const DIST_DIR = path.resolve(__dirname, '../dist');
const OUT_DIR = path.resolve(__dirname, '../../docs/qa/screenshots/shm');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 5199;

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Simple MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// Start static file server
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0].split('#')[0];
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading ' + filePath);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

const scenarios = [
  {
    name: '1-free-oscillation-vertical-spring.png',
    url: `http://localhost:${PORT}/#simple-harmonic-motion?mode=free&apparatus=vertical-spring`,
  },
  {
    name: '2-free-oscillation-pendulum.png',
    url: `http://localhost:${PORT}/#simple-harmonic-motion?mode=free&apparatus=pendulum`,
  },
  {
    name: '3-damped-oscillation.png',
    url: `http://localhost:${PORT}/#simple-harmonic-motion?mode=damped`,
  },
  {
    name: '4-forced-oscillation.png',
    url: `http://localhost:${PORT}/#simple-harmonic-motion?mode=forced`,
  },
  {
    name: '5-mechanical-resonance.png',
    url: `http://localhost:${PORT}/#simple-harmonic-motion?mode=resonance`,
  },
  {
    name: '6-travel-limit-exceeded.png',
    url: `http://localhost:${PORT}/#simple-harmonic-motion?mode=forced&status=exceeded`,
  },
];

function capture(url, outPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1920,1080',
      `--screenshot=${outPath}`,
      '--virtual-time-budget=2000',
      url,
    ];

    execFile(EDGE_PATH, args, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

server.listen(PORT, async () => {
  console.log(`Preview server listening on port ${PORT}...`);
  try {
    for (const s of scenarios) {
      const outPath = path.join(OUT_DIR, s.name);
      console.log(`Capturing: ${s.name}...`);
      await capture(s.url, outPath);
      const stats = fs.statSync(outPath);
      console.log(`  Saved ${s.name} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
    console.log('All screenshots captured successfully.');
  } catch (err) {
    console.error('Error capturing screenshots:', err);
  } finally {
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  }
});

