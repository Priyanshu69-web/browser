const { existsSync } = require('fs');
const { join } = require('path');

const localAppData = process.env.LOCALAPPDATA || '';
const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

const candidates = [
  join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
  join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
];

console.log('Checking browser executables on system:');
for (const c of candidates) {
  const exists = existsSync(c);
  console.log(`  ${exists ? '✅ FOUND' : '❌ not found'}: ${c}`);
  if (exists) {
    console.log(`  >>> THIS IS THE ONE getChromiumPath() RETURNS <<<`);
    break;
  }
}
