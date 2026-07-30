const { chromium } = require('playwright');

async function testProfile(name, proxyHost, proxyPort, proxyUser, proxyPass) {
  console.log(`\n=== Testing "${name}" with proxy ${proxyHost}:${proxyPort} ===`);
  
  let context;
  try {
    context = await chromium.launchPersistentContext('', {
      headless: true,
      proxy: {
        server: `http://${proxyHost}:${proxyPort}`,
        username: proxyUser,
        password: proxyPass
      },
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-infobars'
      ],
      ignoreHTTPSErrors: true
    });

    const page = context.pages()[0] || await context.newPage();

    // Test 1: Load Google
    console.log('  Navigating to https://www.google.com ...');
    const googleRes = await page.goto('https://www.google.com', { timeout: 20000, waitUntil: 'domcontentloaded' });
    console.log(`  ✅ Google loaded: HTTP ${googleRes.status()} | Title: "${await page.title()}"`);

    // Test 2: Check IP via ipinfo
    console.log('  Checking proxy IP via https://ipinfo.io/json ...');
    const ipPage = await context.newPage();
    const ipRes = await ipPage.goto('https://ipinfo.io/json', { timeout: 15000, waitUntil: 'domcontentloaded' });
    const ipText = await ipPage.textContent('body');
    const ipData = JSON.parse(ipText);
    console.log(`  ✅ Proxy IP: ${ipData.ip} | Country: ${ipData.country} | City: ${ipData.city}`);
    
    console.log(`  ✅ "${name}" — BROWSING WORKS!`);
  } catch (err) {
    console.log(`  ❌ "${name}" FAILED: ${err.message}`);
  } finally {
    if (context) await context.close();
  }
}

(async () => {
  // Test Profile "store" with proxy 31.59.20.176:6754
  await testProfile('store', '31.59.20.176', 6754, 'zkymshdu', 'jkkgxqqh8e6x');

  // Test Profile "manager" with proxy 38.154.185.97:6370
  await testProfile('manager', '38.154.185.97', 6370, 'zkymshdu', 'jkkgxqqh8e6x');

  console.log('\n=== ALL TESTS COMPLETE ===');
})();
