const { chromium } = require('playwright');

(async () => {
  console.log('=== Anti-Detect Batch 1 Verification ===\n');

  const ctx = await chromium.launchPersistentContext('', {
    headless: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--enforce-webrtc-ip-permission-check'
    ],
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const page = ctx.pages()[0] || await ctx.newPage();

  // Apply CDP Client Hints
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'Win32',
    userAgentMetadata: {
      brands: [
        { brand: 'Google Chrome', version: '151' },
        { brand: 'Chromium', version: '151' },
        { brand: 'Not)A;Brand', version: '24' }
      ],
      fullVersionList: [
        { brand: 'Google Chrome', version: '151.0.7922.34' },
        { brand: 'Chromium', version: '151.0.7922.34' },
        { brand: 'Not)A;Brand', version: '24.0.0.0' }
      ],
      fullVersion: '151.0.7922.34',
      platform: 'Windows',
      platformVersion: '10.0.0',
      architecture: 'x86',
      model: '',
      mobile: false,
      bitness: '64',
      wow64: false
    }
  });

  // Add init script for hardwareConcurrency
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
  });

  // Navigate to about:blank to trigger init script, then collect results
  await page.goto('about:blank');
  await page.waitForTimeout(500);

  const results = await page.evaluate(async () => {
    const r = {};
    r['userAgent'] = navigator.userAgent;
    r['webdriver'] = navigator.webdriver;
    r['hardwareConcurrency'] = navigator.hardwareConcurrency;
    r['vendor'] = navigator.vendor;
    r['plugins_count'] = navigator.plugins.length;
    r['plugins'] = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      r['plugins'].push({
        name: navigator.plugins[i].name,
        filename: navigator.plugins[i].filename
      });
    }
    r['languages'] = navigator.languages;
    r['deviceMemory'] = navigator.deviceMemory;

    if (navigator.userAgentData) {
      r['uad_brands'] = navigator.userAgentData.brands;
      r['uad_platform'] = navigator.userAgentData.platform;
      r['uad_mobile'] = navigator.userAgentData.mobile;
      try {
        const hev = await navigator.userAgentData.getHighEntropyValues([
          'fullVersionList', 'platformVersion', 'architecture', 'bitness', 'wow64', 'model'
        ]);
        r['uad_fullVersionList'] = hev.fullVersionList;
        r['uad_platformVersion'] = hev.platformVersion;
        r['uad_architecture'] = hev.architecture;
        r['uad_bitness'] = hev.bitness;
      } catch (e) {
        r['uad_hev_error'] = e.message;
      }
    } else {
      r['uad_brands'] = 'MISSING';
    }

    r['chrome_exists'] = typeof window.chrome !== 'undefined';
    r['chrome_app'] = typeof window.chrome?.app !== 'undefined';
    r['chrome_runtime'] = typeof window.chrome?.runtime !== 'undefined';

    return r;
  });

  console.log('--- Navigator ---');
  console.log('userAgent:', results.userAgent);
  console.log('webdriver:', results.webdriver, `(type: ${typeof results.webdriver})`);
  console.log('hardwareConcurrency:', results.hardwareConcurrency);
  console.log('vendor:', results.vendor);
  console.log('deviceMemory:', results.deviceMemory);
  console.log('languages:', JSON.stringify(results.languages));
  console.log('plugins_count:', results.plugins_count);
  results.plugins.forEach(p => console.log(`  plugin: "${p.name}" (${p.filename})`));

  console.log('\n--- Client Hints (userAgentData) ---');
  if (results.uad_brands === 'MISSING') {
    console.log('userAgentData: MISSING (Playwright Chromium strips this)');
  } else {
    console.log('brands:', JSON.stringify(results.uad_brands));
    console.log('platform:', results.uad_platform);
    if (results.uad_fullVersionList) {
      console.log('fullVersionList:', JSON.stringify(results.uad_fullVersionList));
      console.log('platformVersion:', results.uad_platformVersion);
      console.log('architecture:', results.uad_architecture);
      console.log('bitness:', results.uad_bitness);
    }
    if (results.uad_hev_error) {
      console.log('HEV error:', results.uad_hev_error);
    }
  }

  console.log('\n=== VERIFICATION CHECKLIST ===');
  const checks = [
    ['UA contains Chrome/151.0.0.0', results.userAgent.includes('Chrome/151.0.0.0')],
    ['webdriver === false (not undefined)', results.webdriver === false],
    ['hardwareConcurrency === 4', results.hardwareConcurrency === 4],
    ['plugins === 5 (native)', results.plugins_count === 5],
    ['vendor === "Google Inc."', results.vendor === 'Google Inc.'],
  ];

  let allPassed = true;
  for (const [name, passed] of checks) {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) allPassed = false;
  }

  if (results.uad_brands !== 'MISSING') {
    const hasGC = results.uad_brands?.some(b => b.brand === 'Google Chrome');
    console.log(`${hasGC ? '✅' : '❌'} Client Hints has "Google Chrome" brand`);
    if (!hasGC) allPassed = false;
  } else {
    console.log('⚠️  Client Hints: userAgentData unavailable in JS (CDP sets it for HTTP headers only)');
  }

  console.log(`\n${allPassed ? '🎉 ALL CHECKS PASSED' : '⚠️  SOME CHECKS FAILED'}\n`);

  await ctx.close();
})();
