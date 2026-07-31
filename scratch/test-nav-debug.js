const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

async function testNavigation() {
  console.log('[LOG] Starting browser launch test...');
  const userDataDir = path.join(os.tmpdir(), 'test-nav-' + Date.now());
  fs.mkdirSync(userDataDir, { recursive: true });

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

  console.log('[LOG] Launching persistent context...');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    userAgent: spoofedUserAgent,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ['--enable-automation'],
    args
  });

  console.log('[LOG] Context created. Total pages:', context.pages().length);

  async function applyAntiDetectCDP(page) {
    console.log('[LOG] Creating CDP session for page...');
    let cdp = null;
    try {
      cdp = await page.context().newCDPSession(page);
      console.log('[LOG] CDP session attached. Sending Network.setUserAgentOverride...');
      await cdp.send('Network.setUserAgentOverride', {
        userAgent: spoofedUserAgent,
        acceptLanguage: 'en-US,en;q=0.9',
        platform: 'Win32',
        userAgentMetadata: {
          brands: [
            { brand: 'Google Chrome', version: '151' },
            { brand: 'Chromium', version: '151' },
            { brand: 'Not)A;Brand', version: '24' }
          ],
          fullVersionList: [
            { brand: 'Google Chrome', version: chromiumFullVersion },
            { brand: 'Chromium', version: chromiumFullVersion },
            { brand: 'Not)A;Brand', version: '24.0.0.0' }
          ],
          fullVersion: chromiumFullVersion,
          platform: 'Windows',
          platformVersion: '10.0.0',
          architecture: 'x86',
          model: '',
          mobile: false,
          bitness: '64',
          wow64: false
        }
      });
      console.log('[LOG] Network.setUserAgentOverride sent.');

      console.log('[LOG] Sending Network.setExtraHTTPHeaders...');
      await cdp.send('Network.setExtraHTTPHeaders', {
        headers: {
          'Pragma': '',
          'Cache-Control': ''
        }
      });
      console.log('[LOG] Network.setExtraHTTPHeaders sent.');
    } catch (err) {
      console.error('[LOG] CDP Error:', err.message);
    }
  }

  await context.addInitScript(() => {
    try {
      const cleanProps = ['cdc_adoQpoasnfa76pfcZLmcfl_Array', 'cdc_adoQpoasnfa76pfcZLmcfl_Promise', 'cdc_adoQpoasnfa76pfcZLmcfl_Symbol', '$cdc_asdjflasutdfhxcv_'];
      cleanProps.forEach((prop) => {
        delete window[prop];
        delete document[prop];
      });
    } catch {}
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  });

  const pages = context.pages();
  const mainPage = pages.length > 0 ? pages[0] : await context.newPage();

  mainPage.on('request', req => console.log('[PAGE REQ]', req.url()));
  mainPage.on('requestfailed', req => console.log('[PAGE REQ FAILED]', req.url(), req.failure()?.errorText));
  mainPage.on('response', res => console.log('[PAGE RES]', res.url(), res.status()));

  await applyAntiDetectCDP(mainPage);

  context.on('page', async (newPage) => {
    console.log('[LOG] New page opened:', newPage.url());
    newPage.on('request', req => console.log('[NEW PAGE REQ]', req.url()));
    newPage.on('requestfailed', req => console.log('[NEW PAGE REQ FAILED]', req.url(), req.failure()?.errorText));
    newPage.on('response', res => console.log('[NEW PAGE RES]', res.url(), res.status()));
    await applyAntiDetectCDP(newPage);
  });

  console.log('[LOG] Navigating main page to https://www.google.com ...');
  try {
    const res = await mainPage.goto('https://www.google.com', { timeout: 15000, waitUntil: 'domcontentloaded' });
    console.log('[LOG] Navigation SUCCESS! Status:', res ? res.status() : 'no res');
  } catch (err) {
    console.error('[LOG] Navigation FAILED:', err.message);
  }

  console.log('[LOG] Keeping browser open for 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  await context.close();
}

testNavigation();
