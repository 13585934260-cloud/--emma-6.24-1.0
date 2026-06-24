const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const PORT = 3000;

http.createServer((req, res) => {
  let filePath = path.join(dir, req.url === '/' ? 'game.html' : req.url.slice(1));
  filePath = decodeURIComponent(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    const mimes = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
    res.writeHead(200, { 'Content-Type': mimes[path.extname(filePath).toLowerCase()] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => console.log('Server http://0.0.0.0:' + PORT));
