const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const logFile = path.join(__dirname, '../logs/browser-debug.log');
fs.mkdirSync(path.dirname(logFile), { recursive: true });
fs.writeFileSync(logFile, `=== BROWSER DEBUG EXECUTION TRACE START [${new Date().toISOString()}] ===\n\n`);

function logEntry(severity, category, functionName, message, details = {}) {
  const time = new Date().toISOString();
  const entry = `[${time}] [${severity.toUpperCase()}] [${category}] [${functionName}] ${message} ${Object.keys(details).length ? JSON.stringify(details) : ''}\n`;
  console.log(entry.trim());
  fs.appendFileSync(logFile, entry);
}

async function runTrace() {
  logEntry('info', 'LAUNCH', 'runTrace', 'Starting comprehensive execution trace');

  const userDataDir = path.join(os.tmpdir(), 'debug-trace-' + Date.now());
  fs.mkdirSync(userDataDir, { recursive: true });
  logEntry('info', 'LAUNCH', 'runTrace', 'Created UserDataDir', { userDataDir });

  const chromiumVersion = '151.0.0.0';
  const chromiumFullVersion = '151.0.7922.34';
  const spoofedUserAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromiumVersion} Safari/537.36`;

  const args = [
    '--disable-blink-features=AutomationControlled',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-infobars',
    '--disable-component-update',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-features=IsolateOrigins,site-per-process',
    '--lang=en-US,en',
    '--window-size=1280,800',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--enforce-webrtc-ip-permission-check'
  ];

  logEntry('info', 'LAUNCH', 'launchPersistentContext', 'Calling launchPersistentContext', { args, userAgent: spoofedUserAgent });

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      userAgent: spoofedUserAgent,
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--enable-automation'],
      args
    });
    logEntry('info', 'LAUNCH', 'launchPersistentContext', 'BrowserContext created successfully', { pagesCount: context.pages().length });
  } catch (err) {
    logEntry('error', 'LAUNCH', 'launchPersistentContext', 'Failed to launch context', { error: err.message, stack: err.stack });
    return;
  }

  context.on('page', (newPage) => {
    logEntry('info', 'CONTEXT_EVENT', 'context.on(page)', 'New page created in context', { url: newPage.url() });
    setupPageLogging(newPage, 'new-tab');
  });

  context.on('close', () => {
    logEntry('info', 'CONTEXT_EVENT', 'context.on(close)', 'Browser context closed');
  });

  function setupPageLogging(page, label) {
    logEntry('info', 'PAGE_SETUP', 'setupPageLogging', `Setting up listeners for page (${label})`);

    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        logEntry('info', 'NAVIGATION', 'framenavigated', `Page (${label}) MainFrame Navigated`, { url: frame.url() });
      }
    });

    page.on('request', (req) => {
      logEntry('info', 'NETWORK', 'request', `Page (${label}) Request Start`, {
        method: req.method(),
        url: req.url(),
        resourceType: req.resourceType(),
        headers: req.headers()
      });
    });

    page.on('response', (res) => {
      logEntry('info', 'NETWORK', 'response', `Page (${label}) Response Received`, {
        url: res.url(),
        status: res.status(),
        headers: res.headers()
      });
    });

    page.on('requestfailed', (req) => {
      logEntry('error', 'NETWORK', 'requestfailed', `Page (${label}) Request Failed`, {
        url: req.url(),
        errorText: req.failure()?.errorText
      });
    });

    page.on('pageerror', (err) => {
      logEntry('error', 'PAGE_EVENT', 'pageerror', `Page (${label}) Unhandled Exception`, { message: err.message, stack: err.stack });
    });

    page.on('console', (msg) => {
      logEntry('info', 'PAGE_EVENT', 'console', `Page (${label}) Console: [${msg.type()}] ${msg.text()}`);
    });
  }

  const pages = context.pages();
  const mainPage = pages.length > 0 ? pages[0] : await context.newPage();
  setupPageLogging(mainPage, 'main');

  logEntry('info', 'NAVIGATION', 'mainPage.goto', 'Initiating navigation to https://example.com');
  const startNav = Date.now();
  try {
    const res = await mainPage.goto('https://example.com', { timeout: 15000, waitUntil: 'domcontentloaded' });
    logEntry('info', 'NAVIGATION', 'mainPage.goto', 'Navigation completed successfully', {
      status: res ? res.status() : 'null',
      elapsedMs: Date.now() - startNav,
      finalUrl: mainPage.url()
    });
  } catch (err) {
    logEntry('error', 'NAVIGATION', 'mainPage.goto', 'Navigation failed', {
      error: err.message,
      elapsedMs: Date.now() - startNav,
      stack: err.stack
    });
  }

  logEntry('info', 'NAVIGATION', 'mainPage.goto', 'Initiating navigation to https://www.google.com');
  const startGoogle = Date.now();
  try {
    const res2 = await mainPage.goto('https://www.google.com', { timeout: 15000, waitUntil: 'domcontentloaded' });
    logEntry('info', 'NAVIGATION', 'mainPage.goto', 'Google navigation completed successfully', {
      status: res2 ? res2.status() : 'null',
      elapsedMs: Date.now() - startGoogle,
      finalUrl: mainPage.url()
    });
  } catch (err) {
    logEntry('error', 'NAVIGATION', 'mainPage.goto', 'Google navigation failed', {
      error: err.message,
      elapsedMs: Date.now() - startGoogle,
      stack: err.stack
    });
  }

  logEntry('info', 'CLEANUP', 'runTrace', 'Trace completed. Closing context...');
  await context.close();
}

runTrace().catch(err => {
  logEntry('error', 'UNHANDLED', 'global', 'Unhandled trace error', { error: err.message, stack: err.stack });
});
