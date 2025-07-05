const http = require('http');
const fs = require('fs');
const path = require('path');

let showAlert = false;

const server = http.createServer((req, res) => {
  // CORS headers - permitir a cualquier origen (ojo, en producción mejor restringir)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Responder preflight CORS
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/server') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body);
      if(data.showAlert !== undefined) showAlert = data.showAlert;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    });
  } else if (req.method === 'GET' && req.url === '/server') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ showAlert }));
  } else if (req.method === 'GET' && req.url === '/html.html') {
    const filePath = path.join(__dirname, 'html.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error al cargar html.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000, () => console.log('Servidor escuchando en http://localhost:3000'));
