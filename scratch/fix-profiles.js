// Fix existing profiles that have empty country/timezone
const fs = require('fs');
const dbPath = 'C:\\Users\\mishr\\AppData\\Roaming\\browser-profile-manager\\browser-profiles.json';
const d = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let fixed = 0;
d.profiles?.forEach((p) => {
  if (!p.country) { p.country = 'US'; fixed++; }
  if (!p.timezone) { p.timezone = 'America/New_York'; fixed++; }
  if (!p.language) { p.language = 'en-US'; fixed++; }
  // Reset stuck status
  if (p.status === 'running') { p.status = 'ready'; fixed++; }
});

fs.writeFileSync(dbPath, JSON.stringify(d, null, 2), 'utf8');
console.log(`Fixed ${fixed} fields across ${d.profiles?.length || 0} profiles.`);

d.profiles?.forEach((p, i) => {
  console.log(`  Profile ${i} "${p.name}": country=${p.country} timezone=${p.timezone} language=${p.language} proxy=${p.proxy_host || 'none'}`);
});
