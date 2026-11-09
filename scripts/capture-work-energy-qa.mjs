import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'simulation-web', 'dist');
const outDir = path.join(rootDir, 'docs', 'qa', 'browser', 'work-energy-power');

fs.mkdirSync(outDir, { recursive: true });

// ── 1. Static HTTP Server for dist ───────────────────────────────────────────
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0].split('#')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
console.log(`Static server running on http://127.0.0.1:${port}`);

// ── 2. Launch Headless Chrome ─────────────────────────────────────────────────
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cdpPort = 9333;

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${cdpPort}`,
  '--window-size=1920,1080',
  '--hide-scrollbars',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
]);

chrome.on('error', (err) => {
  console.error('Failed to spawn Chrome:', err);
  process.exit(1);
});

// Wait for CDP to be ready
let versionData = null;
for (let i = 0; i < 30; i++) {
  try {
    const resp = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
    if (resp.ok) {
      versionData = await resp.json();
      break;
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 200));
}

if (!versionData) {
  console.error('Chrome CDP did not become ready');
  chrome.kill();
  server.close();
  process.exit(1);
}

// Get the page target
const listResp = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
const targets = await listResp.json();
const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
const wsUrl = pageTarget.webSocketDebuggerUrl;

console.log(`Connecting to page target: ${wsUrl}`);
const ws = new WebSocket(wsUrl);

let msgId = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(data.error);
    else resolve(data.result);
  }
};

await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

function send(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(expr) {
  const res = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

async function capture(filename) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);
}

// Enable Page and Runtime
await send('Page.enable');
await send('Runtime.enable');

// Set device metrics to ensure crisp 1920x1080 at DPR 1
await send('Emulation.setDeviceMetricsOverride', {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false,
});

// Navigate to the simulation
console.log('Navigating to Work, Energy & Power simulation...');
await send('Page.navigate', { url: `http://127.0.0.1:${port}/#work-energy-power` });

// Wait 1.5s for page and canvas to fully initialize
await new Promise((r) => setTimeout(r, 1500));

// ── Screenshot 1: Initial experiment view ────────────────────────────────────
console.log('Capturing: 1-initial-experiment-view.png');
await capture('1-initial-experiment-view.png');

// Start simulation and slide downhill into the spring
console.log('Starting simulation...');
await evalJs("document.getElementById('work-energy-start-btn')?.click()");

// Wait ~1.4s for block to slide down and compress the spring
await new Promise((r) => setTimeout(r, 1400));

// Pause simulation while in spring compression
await evalJs("document.getElementById('work-energy-start-btn')?.click()");
await new Promise((r) => setTimeout(r, 200));

// ── Screenshot 2: Block in spring compression ────────────────────────────────
console.log('Capturing: 2-block-spring-compression.png');
await capture('2-block-spring-compression.png');

// ── Screenshot 3: Energy graph showing Q ─────────────────────────────────────
await evalJs("document.getElementById('graph-tab-energy')?.click()");
await new Promise((r) => setTimeout(r, 300));
console.log('Capturing: 3-energy-graph-showing-q.png');
await capture('3-energy-graph-showing-q.png');

// ── Screenshot 4: Power graph showing all four force contributions ───────────
await evalJs("document.getElementById('graph-tab-power')?.click()");
await new Promise((r) => setTimeout(r, 300));
console.log('Capturing: 4-power-graph-four-contributions.png');
await capture('4-power-graph-four-contributions.png');

// ── Screenshot 5: Force-displacement graph ───────────────────────────────────
await evalJs("document.getElementById('graph-tab-force')?.click()");
await new Promise((r) => setTimeout(r, 300));
console.log('Capturing: 5-force-displacement-graph.png');
await capture('5-force-displacement-graph.png');

// Cleanup
console.log('Finished capturing screenshots.');
ws.close();
chrome.kill();
server.close();
process.exit(0);
