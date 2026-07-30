const { chromium } = require('playwright');
const http = require('http');
const net = require('net');
const path = require('path');
const os = require('os');
const fs = require('fs');

const PROXY_HOST = '31.59.20.176';
const PROXY_PORT = 6754;
const PROXY_USER = 'zkymshdu';
const PROXY_PASS = 'jkkgxqqh8e6x';

async function step(name, fn) {
  process.stdout.write(`[${name}] `);
  try {
    const result = await fn();
    console.log('✅', result);
    return true;
  } catch (err) {
    console.log('❌', err.message || err);
    return false;
  }
}

(async () => {
  console.log('=== SYSTEMATIC PROXY DIAGNOSIS ===\n');

  // Step 1: Raw TCP
  await step('TCP connect to proxy', () => new Promise((resolve, reject) => {
    const sock = new net.Socket();
    sock.setTimeout(8000);
    sock.on('connect', () => { sock.destroy(); resolve(`TCP to ${PROXY_HOST}:${PROXY_PORT} OK`); });
    sock.on('timeout', () => { sock.destroy(); reject(new Error('TCP timeout')); });
    sock.on('error', (e) => { sock.destroy(); reject(e); });
    sock.connect(PROXY_PORT, PROXY_HOST);
  }));

  // Step 2: HTTP CONNECT tunnel
  await step('HTTP CONNECT tunnel', () => new Promise((resolve, reject) => {
    const req = http.request({
      host: PROXY_HOST, port: PROXY_PORT, method: 'CONNECT', path: 'www.google.com:443',
      headers: { 'Proxy-Authorization': 'Basic ' + Buffer.from(`${PROXY_USER}:${PROXY_PASS}`).toString('base64') }
    });
    req.setTimeout(8000);
    req.on('connect', (res, socket) => { socket.destroy(); resolve(`CONNECT status: ${res.statusCode}`); });
    req.on('timeout', () => { req.destroy(); reject(new Error('CONNECT timeout')); });
    req.on('error', (e) => reject(e));
    req.end();
  }));

  // Step 3: HTTP GET through proxy (non-CONNECT, plain HTTP)
  await step('HTTP GET via proxy', () => new Promise((resolve, reject) => {
    const req = http.request({
      host: PROXY_HOST, port: PROXY_PORT, method: 'GET',
      path: 'http://httpbin.org/ip',
      headers: {
        'Host': 'httpbin.org',
        'Proxy-Authorization': 'Basic ' + Buffer.from(`${PROXY_USER}:${PROXY_PASS}`).toString('base64')
      }
    });
    req.setTimeout(10000);
    let body = '';
    req.on('response', (res) => {
      res.on('data', (d) => body += d);
      res.on('end', () => resolve(`HTTP ${res.statusCode}: ${body.trim()}`));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('HTTP timeout')); });
    req.on('error', (e) => reject(e));
    req.end();
  }));

  // Step 4: Playwright Chromium WITHOUT proxy (baseline internet check)
  await step('Playwright Chromium (NO proxy)', async () => {
    const tmpDir = path.join(os.tmpdir(), 'pw-test-noproxy-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    const ctx = await chromium.launchPersistentContext(tmpDir, {
      headless: true,
      args: ['--no-first-run', '--no-default-browser-check', '--disable-infobars']
    });
    const page = ctx.pages()[0] || await ctx.newPage();
    const res = await page.goto('https://www.google.com', { timeout: 15000, waitUntil: 'domcontentloaded' });
    const title = await page.title();
    await ctx.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return `HTTP ${res.status()} — Title: "${title}"`;
  });

  // Step 5: Playwright Chromium WITH proxy (the real test)
  await step('Playwright Chromium WITH proxy (persistent context)', async () => {
    const tmpDir = path.join(os.tmpdir(), 'pw-test-proxy-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    const ctx = await chromium.launchPersistentContext(tmpDir, {
      headless: true,
      proxy: {
        server: `http://${PROXY_HOST}:${PROXY_PORT}`,
        username: PROXY_USER,
        password: PROXY_PASS
      },
      args: ['--no-first-run', '--no-default-browser-check', '--disable-infobars'],
      ignoreHTTPSErrors: true
    });
    const page = ctx.pages()[0] || await ctx.newPage();
    const res = await page.goto('https://www.google.com', { timeout: 20000, waitUntil: 'domcontentloaded' });
    const title = await page.title();
    await ctx.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return `HTTP ${res.status()} — Title: "${title}"`;
  });

  // Step 6: Playwright with --proxy-server CLI arg (no proxy object)
  await step('Playwright Chromium with --proxy-server CLI arg', async () => {
    const tmpDir = path.join(os.tmpdir(), 'pw-test-cliproxy-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    const ctx = await chromium.launchPersistentContext(tmpDir, {
      headless: true,
      args: [
        `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
        '--no-first-run', '--no-default-browser-check', '--disable-infobars'
      ],
      ignoreHTTPSErrors: true
    });
    const page = ctx.pages()[0] || await ctx.newPage();

    // Handle auth via page route
    await page.route('**/*', async (route) => {
      await route.continue();
    });

    const res = await page.goto('http://httpbin.org/ip', { timeout: 20000, waitUntil: 'domcontentloaded' });
    const body = await page.textContent('body');
    await ctx.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return `HTTP ${res.status()} — Body: ${body?.trim()}`;
  });

  // Step 7: Non-persistent browser with proxy
  await step('Playwright non-persistent browser with proxy', async () => {
    const browser = await chromium.launch({
      headless: true,
      proxy: {
        server: `http://${PROXY_HOST}:${PROXY_PORT}`,
        username: PROXY_USER,
        password: PROXY_PASS
      },
      args: ['--no-first-run', '--no-default-browser-check']
    });
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    const res = await page.goto('https://www.google.com', { timeout: 20000, waitUntil: 'domcontentloaded' });
    const title = await page.title();
    await browser.close();
    return `HTTP ${res.status()} — Title: "${title}"`;
  });

  console.log('\n=== DIAGNOSIS COMPLETE ===');
})();
