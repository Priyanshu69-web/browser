const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const orbitaExe = 'C:\\Users\\mishr\\.gologin\\browser\\orbita-browser-149\\chrome.exe';
const userDataDir = path.join(os.tmpdir(), 'test-orbita-direct-' + Date.now());
fs.mkdirSync(userDataDir, { recursive: true });

console.log('Testing direct child_process.spawn of Orbita Browser (No Playwright CDP Pipe)...');

const proxyHost = '31.56.127.193';
const proxyPort = '7684';

const args = [
  `--user-data-dir=${userDataDir}`,
  `--proxy-server=http://${proxyHost}:${proxyPort}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--lang=en-US',
  'https://www.google.com'
];

const child = spawn(orbitaExe, args, {
  detached: true,
  stdio: 'ignore'
});

child.unref();
console.log('✅ Orbita launched as native process! PID:', child.pid);
