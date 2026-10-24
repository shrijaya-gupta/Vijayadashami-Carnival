const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  
  // Check if target is inside dist or root
  let targetPath = path.join(__dirname, reqPath);
  
  // Prefer dist/ for frontend assets and index if built
  if (fs.existsSync(path.join(__dirname, 'dist', 'index.html')) && !reqPath.startsWith('/admin') && !reqPath.startsWith('/backend')) {
    const distTarget = path.join(__dirname, 'dist', reqPath);
    if (fs.existsSync(distTarget) && !fs.statSync(distTarget).isDirectory()) {
      targetPath = distTarget;
    } else if (reqPath === '/index.html') {
      targetPath = path.join(__dirname, 'dist', 'index.html');
    }
  }

  // Handle SPA fallback for client-side routes
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
      targetPath = path.join(__dirname, 'dist', 'index.html');
    } else {
      targetPath = path.join(__dirname, 'index.html');
    }
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(targetPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      if (reqPath.startsWith('/admin')) {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, must-revalidate'
        });
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
      }
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Vijayadashami Carnival web server running at http://localhost:${PORT}`);
});
