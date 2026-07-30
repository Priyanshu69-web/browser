const fs = require('fs');
const dbPath = 'C:\\Users\\mishr\\AppData\\Roaming\\browser-profile-manager\\browser-profiles.json';
const d = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('Profiles count:', d.profiles?.length);
d.profiles?.forEach((p, i) => {
  console.log(`\n--- Profile ${i}: ${p.name} ---`);
  console.log('  proxy_type:', p.proxy_type);
  console.log('  proxy_host:', p.proxy_host);
  console.log('  proxy_port:', p.proxy_port);
  console.log('  proxy_user_enc:', p.proxy_username_encrypted ? p.proxy_username_encrypted.substring(0, 30) + '...' : '(empty)');
  console.log('  proxy_pass_enc:', p.proxy_password_encrypted ? p.proxy_password_encrypted.substring(0, 30) + '...' : '(empty)');
  console.log('  country:', p.country);
  console.log('  timezone:', p.timezone);
  console.log('  language:', p.language);
  console.log('  homepage:', p.homepage);
  console.log('  profile_path:', p.profile_path);
  console.log('  status:', p.status);
});
