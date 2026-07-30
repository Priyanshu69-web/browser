const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

const PROXY_HOST = '31.59.20.176';
const PROXY_PORT = 6754;
const PROXY_USER = 'zkymshdu';
const PROXY_PASS = 'jkkgxqqh8e6x';

(async () => {
  console.log('=== TEST: --proxy-server CLI + CDP Fetch.authRequired ===\n');

  const tmpDir = path.join(os.tmpdir(), 'pw-cdp-auth-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

  const context = await chromium.launchPersistentContext(tmpDir, {
    headless: true,
    args: [
      `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-infobars'
    ],
    ignoreHTTPSErrors: true
  });

  // Get the CDP session for the default page
  const page = context.pages()[0] || await context.newPage();
  const cdpSession = await page.context().newCDPSession(page);

  // Enable Fetch domain with auth handling
  await cdpSession.send('Fetch.enable', {
    handleAuthRequests: true,
    patterns: [{ urlPattern: '*' }]
  });

  // Handle auth challenge
  cdpSession.on('Fetch.authRequired', async (event) => {
    console.log(`  [CDP] Auth required for: ${event.request.url}`);
    await cdpSession.send('Fetch.continueWithAuth', {
      requestId: event.requestId,
      authChallengeResponse: {
        response: 'ProvideCredentials',
        username: PROXY_USER,
        password: PROXY_PASS
      }
    });
  });

  // Let other requests pass through
  cdpSession.on('Fetch.requestPaused', async (event) => {
    await cdpSession.send('Fetch.continueRequest', {
      requestId: event.requestId
    });
  });

  // Navigate
  console.log('  Navigating to https://www.google.com ...');
  try {
    const res = await page.goto('https://www.google.com', { timeout: 20000, waitUntil: 'domcontentloaded' });
    const title = await page.title();
    console.log(`  ✅ Google loaded: HTTP ${res.status()} — Title: "${title}"`);
  } catch (err) {
    console.log(`  ❌ Google failed: ${err.message}`);
  }

  // Check IP
  console.log('  Checking IP via ipinfo.io ...');
  try {
    const page2 = await context.newPage();
    const cdp2 = await page2.context().newCDPSession(page2);
    await cdp2.send('Fetch.enable', { handleAuthRequests: true, patterns: [{ urlPattern: '*' }] });
    cdp2.on('Fetch.authRequired', async (event) => {
      await cdp2.send('Fetch.continueWithAuth', {
        requestId: event.requestId,
        authChallengeResponse: { response: 'ProvideCredentials', username: PROXY_USER, password: PROXY_PASS }
      });
    });
    cdp2.on('Fetch.requestPaused', async (event) => {
      await cdp2.send('Fetch.continueRequest', { requestId: event.requestId });
    });

    const ipRes = await page2.goto('https://ipinfo.io/json', { timeout: 15000, waitUntil: 'domcontentloaded' });
    const body = await page2.textContent('body');
    const ipData = JSON.parse(body);
    console.log(`  ✅ Proxy IP: ${ipData.ip} | Country: ${ipData.country} | City: ${ipData.city}`);
  } catch (err) {
    console.log(`  ❌ IP check failed: ${err.message}`);
  }

  await context.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('\n=== DONE ===');
})();
