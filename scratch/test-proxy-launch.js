const { chromium } = require('playwright');

async function testLaunch() {
  console.log('Testing Playwright Chromium proxy navigation to Google...');
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    proxy: {
      server: 'http://31.59.20.176:6754',
      username: 'zkymshdu',
      password: 'jkkgxqqh8e6x'
    },
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-infobars',
      '--ignore-certificate-errors'
    ]
  });

  const page = context.pages()[0] || await context.newPage();
  console.log('Navigating to https://www.google.com ...');
  
  try {
    const response = await page.goto('https://www.google.com', { timeout: 20000, waitUntil: 'domcontentloaded' });
    console.log('SUCCESS! Google Status:', response.status());
    const title = await page.title();
    console.log('Page Title:', title);
  } catch (err) {
    console.error('Page load error:', err.message);
  } finally {
    await context.close();
  }
}

testLaunch();
