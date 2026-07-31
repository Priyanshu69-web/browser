const net = require('net');
const fs = require('fs');

const dbPath = 'C:\\Users\\mishr\\AppData\\Roaming\\browser-profile-manager\\browser-profiles.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const p1 = db.profiles.find(p => p.id === '5b217361-4a97-4eb5-8737-de710cb1bf81');

console.log('Profile 1 Host:', p1.proxy_host, 'Port:', p1.proxy_port);

const socket = new net.Socket();
socket.setTimeout(4000);
socket.on('connect', () => {
  console.log('✅ TCP CONNECT SUCCESSFUL TO PROFILE 1 PROXY!');
  socket.end();
});
socket.on('timeout', () => {
  console.error('❌ TCP CONNECT TIMEOUT (PROFILE 1 PROXY IS DEAD)');
  socket.destroy();
});
socket.on('error', (err) => {
  console.error('❌ TCP ERROR TO PROFILE 1 PROXY:', err.message);
});
socket.connect(p1.proxy_port, p1.proxy_host);
